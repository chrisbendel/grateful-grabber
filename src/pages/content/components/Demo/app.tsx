import { useEffect, useState } from "react";

export default function App() {
  const [show, setShow] = useState();

  useEffect(() => {
    fetch(window.location.href + "&output=json")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setShow(data);
      });
  }, []);
  return (
    <div className="content-view container container-ia width-max relative-row-wrap info-top">
      <div className="container container-ia">content view</div>
    </div>
  );
}
