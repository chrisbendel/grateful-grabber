import React, { FC } from "react";
import "@pages/popup/Popup.css";

// TODO Simple button to download show here
export const Popup: FC = () => {
  return (
    <div className="App">
      <header
        className="App-header"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <span>Thanks for using grateful grabber!</span>
        <span>
          If you would like to show support financially, please consider
          donating to an organization that is doing good work such as&nbsp;
          <a target="_blank" href="https://archive.org/donate" rel="noreferrer">
            Archive.org
          </a>
          <span> or </span>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.waterwheelfoundation.org/donate/"
          >
            Waterwheel Foundation
          </a>
        </span>

        <p>
          Grateful Grabber is&nbsp;
          <a href="https://github.com/chrisbendel/grateful-grabber/blob/main/LICENSE">
            open source.
          </a>
          <p>If you would like to contribute, please feel free!</p>
        </p>
      </header>
    </div>
  );
};
