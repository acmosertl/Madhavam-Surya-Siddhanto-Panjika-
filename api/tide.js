// /api/tide.js
export default async function handler(req, res) {
  try {
    const lat = 22.5726;
    const lon = 88.3639;
    const tideUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&begin_date=today&range=24&station=8720218&time_zone=lst_ldt&units=metric&interval=hilo&format=json`;
    
    let tideData;
    try {
      const r = await fetch(tideUrl);
      tideData = await r.json();
    } catch {
      tideData = {
        predictions: [
          { t: "05:12 AM", type: "High" },
          { t: "11:36 AM", type: "Low" },
          { t: "05:59 PM", type: "High" },
          { t: "11:20 PM", type: "Low" },
        ],
      };
    }

    res.status(200).json({
      ok: true,
      updated: new Date().toISOString(),
      data: {
        location: "কলকাতা (Garden Reach)",
        high_tides: tideData.predictions.filter((p) => p.type === "High"),
        low_tides: tideData.predictions.filter((p) => p.type === "Low"),
        note: "Free API + fallback static data",
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
