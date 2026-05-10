import { FC, useEffect, useState } from "react";
import {
  ArchiveFile,
  ArchiveShow,
  Track,
} from "@pages/content/models/interfaces";

const getTracks = (show: ArchiveShow): Track[] => {
  const baseURL = `https://${show.server}${show.dir}`;
  return Object.entries(show.files)
    .filter(([, file]: [string, ArchiveFile]) => file.format === "VBR MP3")
    .map(([key, data], index) => {
      const url = baseURL + key;
      let title = data.title || data.original;
      title = title.replace(/-|[^-_,A-Za-z0-9 ]+/g, "").trim();
      return { title: index + 1 + ". " + title, url } as Track;
    });
};

const getInfoFileUrl = (show: ArchiveShow) => {
  const baseURL = `https://${show.server}${show.dir}`;
  const infoFile = Object.keys(show.files).find(
    (key) => show.files[key].format === "Text" && key !== "/ffp.txt"
  );
  return `${baseURL}/${infoFile}`;
};

const getFolderName = (show: ArchiveShow) => {
  const date = show.metadata.date?.[0] ?? "";
  const venue = show.metadata.venue?.[0] ?? "";
  const source = show.metadata.source?.[0] ?? "";
  const sourceType = source.split(" ")?.[0] ?? "";
  const identifier = show.metadata.identifier?.[0] ?? "";

  // Prefer full identifier, fall back to descriptive string
  let folderName = identifier;

  if (!folderName) {
    folderName = date;
    if (venue) folderName += ` - ${venue}`;
    if (sourceType) folderName += ` (${sourceType})`;
  }

  folderName = folderName.slice(0, 255);

  return prompt(`Custom folder title? Default ${folderName}`, folderName);
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
  // eslint-disable-next-line no-constant-condition
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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const downloadShow = async (archiveShow: ArchiveShow) => {
    setError(null);
    setLoading(true);
    setProgress(0);
    setSuccess(false);

    const showTitle = getFolderName(archiveShow);
    if (!showTitle) {
      setLoading(false);
      return;
    }

    try {
      const tracks = getTracks(archiveShow);

      // Kick off all downloads via the background script and get their IDs
      const downloadPromises = [
        chrome.runtime.sendMessage({
          type: "download",
          url: getInfoFileUrl(archiveShow),
          filename: `${showTitle}/info.txt`,
        }),
        ...tracks.map((track) =>
          chrome.runtime.sendMessage({
            type: "download",
            url: track.url,
            filename: `${showTitle}/${track.title}.mp3`,
          })
        ),
      ];

      const downloadIds = await Promise.all(downloadPromises);

      // Poll the background script for progress
      const totalFiles = downloadIds.length;
      let completed = 0;

      while (completed < totalFiles) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // returns an array of DownloadItems corresponding to downloadIds
        const states = await chrome.runtime.sendMessage({
          type: "check_progress",
          downloadIds,
        });

        let currentCompleted = 0;
        let totalBytes = 0;
        let receivedBytes = 0;

        states.forEach((state) => {
          if (!state) {
            currentCompleted++;
            return;
          }
          if (state.state === "complete") {
            currentCompleted++;
          }

          if (state.totalBytes > 0) {
            totalBytes += state.totalBytes;
            receivedBytes += state.bytesReceived;
          }
        });

        completed = currentCompleted;

        // Either accurately track bytes or fallback to file count progress
        if (totalBytes > 0) {
          setProgress(receivedBytes / totalBytes);
        } else {
          setProgress(completed / totalFiles);
        }
      }

      setProgress(1);
      setSuccess(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err.toString());
      console.error("Error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setProgress(0);
        setSuccess(false);
      }, 5000);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <button
        onClick={() => downloadShow(show)}
        className="minimalist-button"
        disabled={loading || success}
      >
        {loading
          ? "Downloading... Please be patient"
          : success
          ? "Success!"
          : "Download Show"}
      </button>
      {progress && !success ? <progress value={progress}> </progress> : null}
      {error && (
        <span
          style={{
            fontSize: ".75em",
            color: "red",
          }}
        >
          Something went wrong, restart the download, it should pick up where
          you left off :)
        </span>
      )}
    </div>
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
