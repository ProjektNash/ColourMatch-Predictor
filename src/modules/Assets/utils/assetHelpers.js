export function getAreas() {
  const data = localStorage.getItem("areas");
  return data ? JSON.parse(data) : [];
}

export function saveAreas(updatedList = null, updatedArea = null) {
  const current = getAreas();
  let newList = current;

  if (updatedList) newList = updatedList;
  else if (updatedArea) {
    const idx = current.findIndex((a) => a.id === updatedArea.id);
    if (idx >= 0) current[idx] = updatedArea;
    else current.push(updatedArea);
    newList = current;
  }

  localStorage.setItem("areas", JSON.stringify(newList));
}
