import { FC, useEffect, useState } from "react";
import {
  ArchiveFile,
  ArchiveShow,
  Track,
} from "@pages/content/models/interfaces";
import pickBy from "lodash-es/pickBy";
import findKey from "lodash-es/findKey";
import JSZip from "jszip";

const getTracks = (show: ArchiveShow): Track[] => {
  const mp3Files = pickBy(show.files, function (file: ArchiveFile) {
    return file.format === "VBR MP3";
  });
  const baseURL = `https://${show.server}${show.dir}`;
  return Object.keys(mp3Files).map((key, index) => {
    const data = mp3Files[key];
    const url = baseURL + key;
    let title = data.title || data.original;
    title = title.replace(/-|[^-_,A-Za-z0-9 ]+/g, "").trim();
    return { title: index + 1 + ". " + title, url: url } as Track;
  });
};

const getInfoFileUrl = (show: ArchiveShow) => {
  const baseURL = `https://${show.server}${show.dir}`;
  const infoFile = findKey(show.files, (value, key) => {
    return value.format === "Text" && key !== "/ffp.txt";
  });

  return `${baseURL}/${infoFile}`;
};

const getShowTitle = (show: ArchiveShow) => {
  return prompt(
    `Custom folder title? Default ${show.metadata.date[0]}`,
    show.metadata.date[0]
  );
};

async function fetchWithRedirect(url: string) {
  const response = await fetch(url, { redirect: "follow" });
  if (response.status === 302) {
    const redirectUrl = response.headers.get("Location");
    if (!redirectUrl) {
      throw new Error("Redirect URL not found");
    }
    return fetch(redirectUrl); // Fetch the redirect URL
  } else if (response.ok) {
    return response;
  } else {
    throw new Error("Network response was not ok");
  }
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let retries = 0;
  while (true) {
    try {
      const response = await fetchWithRedirect(url);
      if (response.ok) {
        return response;
      } else {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error; // If max retries exceeded, propagate the error
      }
      console.log(
        `Error occurred, retrying (${retries}/${maxRetries}):`,
        error
      );
      // Wait for a short duration before retrying (you can adjust the duration as needed)
      await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
    }
  }
}

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
    <div className="container container-ia width-max relative-row-wrap info-top">
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
            <DownloadIndividualSong show={archiveShow} />
          </div>
        </div>
      </div>
    </div>
  );
}

const DownloadIndividualSong: FC<{ show: ArchiveShow }> = ({ show }) => {
  const [loadingTracks, setLoadingTracks] = useState<string[]>([]);
  const tracks = getTracks(show);

  const onDownload = async (event) => {
    const selectedOption = event.target.selectedOptions[0];
    const title = selectedOption.text;
    const url = selectedOption.value;
    setLoadingTracks((prevState) => [...prevState, title]);
    await downloadFile(url, title, ".mp3");
    setLoadingTracks(loadingTracks.filter((t) => t == title));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
      }}
    >
      <select onChange={onDownload} className="minimalist-select">
        <option>Download Individually</option>
        {tracks.map((track) => {
          return (
            <option
              key={track.title}
              onSelect={() => onDownload(track)}
              value={track.url}
            >
              {track.title}
            </option>
          );
        })}
      </select>

      {loadingTracks.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {loadingTracks.map((title) => (
            <span key={title}>Downloading {title}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const DownloadButton: FC<{ show: ArchiveShow }> = ({ show }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const downloadShow = async (archiveShow: ArchiveShow) => {
    setError(null);

    const showTitle = getShowTitle(archiveShow);
    if (!showTitle) return;

    setLoading(true);

    await createZip(archiveShow, setProgress)
      .then((blob) => downloadZip(showTitle, blob, setProgress))
      .catch((error) => {
        setError(error.toString());
        setLoading(false);
        console.error("Error:", error);
      });

    setLoading(false);
    setProgress(0);
  };

  return (
    <>
      <button
        onClick={() => downloadShow(show)}
        className="minimalist-button"
        disabled={loading}
      >
        {loading ? "Downloading... Please be patient" : "Download Show"}
      </button>
      {progress ? <progress value={progress}> </progress> : null}
      {error && (
        <span
          style={{
            fontSize: ".75em",
          }}
        >
          Something went wrong, restart the download, it should pick up where
          you left off :)
        </span>
      )}
    </>
  );
};

async function downloadFile(url: string, fileName: string, extension = ".mp3") {
  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`);
  }

  const blob = await response.blob();

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName}${extension}`;

  a.click();

  URL.revokeObjectURL(a.href);
}

async function getFileBlob(
  url: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`);
  }

  const contentLength = parseInt(
    response.headers.get("Content-Length") || "0",
    10
  );
  let receivedLength = 0;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;
    const progress = receivedLength / contentLength;
    onProgress?.(progress);
  }

  return new Blob(chunks);
}

async function createZip(
  show: ArchiveShow,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  let completedCount = 0;
  const mp3Urls = getTracks(show);
  const infoFile = getInfoFileUrl(show);

  const infoBlob = await getFileBlob(infoFile);
  zip.file("info.txt", infoBlob);

  for (const url of mp3Urls) {
    const mp3Blob = await getFileBlob(url.url, (progress) => {
      const overallProgress = (completedCount + progress) / mp3Urls.length;
      onProgress(overallProgress);
    });

    zip.file(`${url.title}.mp3`, mp3Blob);
    completedCount++;
    onProgress(completedCount / mp3Urls.length);
  }

  return await zip.generateAsync({ type: "blob" });
}

function downloadZip(
  folderName: string,
  blob: Blob,
  onProgress: (progress: number) => void
) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${folderName}.zip`;
  a.click();
  onProgress(1); // Mark progress as completed
}
