import { FC, useEffect, useState } from "react";
import {
  ArchiveFile,
  MP3Url,
  ArchiveShow,
} from "@pages/content/models/interfaces";
import streamSaver from "streamsaver";
import pickBy from "lodash-es/pickBy";
import findKey from "lodash-es/findKey";
import ZIP from "@pages/content/utils/zip-stream.js";

const getMP3Urls = (show: ArchiveShow) => {
  const mp3Files = pickBy(show.files, function (file: ArchiveFile) {
    return file.format === "VBR MP3";
  });
  const baseURL = `https://${show.server}${show.dir}`;
  return Object.keys(mp3Files).map((key, index) => {
    const data = mp3Files[key];
    const url = baseURL + key;
    let title = data.title || data.original;
    title = title.replace(/-|[^-_,A-Za-z0-9 ]+/g, "").trim();
    return { title: index + 1 + ". " + title, track: title, url: url };
  });
};

const getInfoFileUrl = (show: ArchiveShow) => {
  const baseURL = `https://${show.server}${show.dir}`;
  const infoFile = findKey(show.files, (value, key) => {
    return value.format === "Text" && key !== "/ffp.txt";
  });

  return `${baseURL}/${infoFile}`;
};

// TODO Allow option for selecting show format OR
//  Prompt user for download title? window.prompt?
const getShowTitle = (show: ArchiveShow) => {
  return show.metadata.date[0];
};

const createZip = async (show: ArchiveShow) => {
  const fileStream = streamSaver.createWriteStream(`${getShowTitle(show)}.zip`);
  const mp3s = getMP3Urls(show);

  const readableZipStream = new ZIP({
    async pull(ctrl) {
      // Gets executed everytime zip.js asks for more data
      const infoFile = await fetch(getInfoFileUrl(show));
      ctrl.enqueue({
        name: "info.txt",
        stream: () => infoFile.body,
      });

      // TODO Implement range fetching: https://www.zeng.dev/post/2023-http-range-and-play-mp4-in-browser/
      await Promise.all(
        mp3s.map(async (mp3) => {
          const res = await fetch(mp3.url);
          const stream = () => res.body;
          ctrl.enqueue({ name: `${mp3.title}.mp3`, stream });
        })
      );

      ctrl.close();
    },
  });

  return readableZipStream.pipeTo(fileStream);
};

export default function App() {
  const [archiveShow, setArchiveShow] = useState<ArchiveShow>();

  useEffect(() => {
    fetch(window.location.href + "&output=json")
      .then((res) => res.json())
      .then((archiveShowInfo) => setArchiveShow(archiveShowInfo));
  }, []);

  if (!archiveShow) {
    return null;
  }

  return (
    <div className="content-view container container-ia width-max relative-row-wrap info-top">
      <div className="container container-ia">
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <h3>Grateful Grabber</h3>
            <DownloadButton show={archiveShow} />
          </div>
        </div>
      </div>
    </div>
  );
}

const DownloadButton: FC<{ show: ArchiveShow }> = ({ show }) => {
  const [loading, setLoading] = useState(false);

  const downloadShow = async (archiveShow: ArchiveShow) => {
    setLoading(true);
    await createZip(archiveShow);
    setLoading(false);
  };

  return (
    <button
      onClick={() => downloadShow(show)}
      style={{
        borderRadius: "1rem",
        fontSize: "2rem",
      }}
      disabled={loading}
    >
      Download Show
    </button>
  );
};
