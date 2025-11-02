import React, { useState, useEffect } from "react";
import Areas from "./pages/Areas";
import AreaAssets from "./pages/AreaAssets";
import { getAreas, saveAreas } from "./utils/assetHelpers";

export default function Assets() {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);

  useEffect(() => {
    setAreas(getAreas());
  }, []);

  const updateAreas = (updatedArea) => {
    const updatedList = areas.map((a) =>
      a.id === updatedArea.id ? updatedArea : a
    );
    setAreas(updatedList);
    saveAreas(updatedList);
  };

  return (
    <div className="p-4">
      {!selectedArea ? (
        <Areas setSelectedArea={setSelectedArea} />
      ) : (
        <AreaAssets
          area={selectedArea}
          goBack={() => setSelectedArea(null)}
          updateAreas={updateAreas}
        />
      )}
    </div>
  );
}
