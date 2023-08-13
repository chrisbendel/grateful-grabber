import { useEffect, useState } from "react";
import * as streamsaver from "streamsaver";
import { AudioFile } from "@pages/content/models/file-interface";
import pickBy from "lodash-es/pickBy";

const getFiles = () => {};

const getMP3s = (base: string, files: Record<string, AudioFile>) => {
  const mp3_files = pickBy(files, function (file: AudioFile) {
    return file.format === "VBR MP3";
  });
  console.log(mp3_files);
  return mp3_files;
};

const getSHNs = (base: string) => {};

export default function App() {
  const [show, setShow] = useState();

  useEffect(() => {
    fetch(window.location.href + "&output=json")
      .then((res) => res.json())
      .then((data) => {
        console.log("Data: ", data);
        const baseURL = `{data.server}${data.dir}`;
        getMP3s(baseURL, data.files);
        setShow(data);
      });
  }, []);
  return (
    <div className="content-view container container-ia width-max relative-row-wrap info-top">
      <div className="container container-ia">Grateful Grabber</div>
    </div>
  );
}
