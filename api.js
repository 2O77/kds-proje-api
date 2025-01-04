const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const app = express();

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "354657",
  database: "kds_proje",
};

// Cities in Turkey
const cities = [
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Ankara",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkari",
  "Hatay",
  "Iğdır",
  "Isparta",
  "İstanbul",
  "İzmir",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kilis",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Şanlıurfa",
  "Siirt",
  "Sinop",
  "Şırnak",
  "Sivas",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
];

// Key cities with hospitals
const keyCities = ["İstanbul", "İzmir", "Bursa", "Balıkesir", "Ankara"];

// Generate random data for hospitals
function generateData() {
  const data = [];
  for (let year = 2015; year <= 2025; year++) {
    for (const city of cities) {
      const isKeyCity = keyCities.includes(city);
      const hospitalCount = isKeyCity ? Math.floor(Math.random() * 6) : 0;

      // If it's not a key city, generate patientCount and capacity between 0 and 3000
      const patientCount = Math.floor(Math.random() * 3001); // Random value from 0 to 3000
      const capacity = Math.floor(Math.random() * 3001); // Random value from 0 to 3000

      // If it is a key city, make sure hospitalCount, patientCount, and capacity are within reason
      if (hospitalCount > 0) {
        data.push([city, hospitalCount, patientCount, capacity, year]);
      } else {
        // For non-key cities, hospitalCount is 0, but patientCount and capacity are still random
        data.push([city, hospitalCount, patientCount, capacity, year]);
      }
    }
  }
  return data;
}

// Endpoint to get data for a specific city
app.get("/potentials/:cityName", async (req, res) => {
  const cityName = req.params.cityName;
  const connection = await mysql.createConnection(dbConfig);

  const query = `
    SELECT 
      sehir, 
      hastane_sayisi, 
      hasta_sayisi, 
      total_kapasite, 
      yil 
    FROM 
      potansiyel
    WHERE 
      sehir = ?
  `;

  try {
    const [results] = await connection.execute(query, [cityName]);
    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: `No data found for city: ${cityName}` });
    }
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await connection.end();
  }
});

app.get("/potentials", async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);

  const query = `
        SELECT 
        sehir, 
        hastane_sayisi, 
        hasta_sayisi, 
        total_kapasite, 
        yil 
        FROM 
        potansiyel
    `;

  try {
    const [results] = await connection.execute(query);
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await connection.end();
  }
});

app.post("/generate", async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);

  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS potansiyel (
        id VARCHAR(36) PRIMARY KEY,
        sehir VARCHAR(100) NOT NULL,
        hastane_sayisi INT NOT NULL,
        hasta_sayisi INT NOT NULL,
        total_kapasite INT NOT NULL,
        yil INT NOT NULL
      )
    `;

  try {
    await connection.execute(createTableQuery);

    const data = generateData();

    // Insert data into the table
    const insertQuery = `
        INSERT INTO potansiyel (id, sehir, hastane_sayisi, hasta_sayisi, total_kapasite, yil)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
    for (const row of data) {
      const rowWithId = [uuidv4(), ...row]; // Prepend UUID to the row
      await connection.execute(insertQuery, rowWithId);
    }

    res
      .status(201)
      .json({ message: "Data generated and inserted successfully." });
  } catch (err) {
    console.error("Error generating data:", err);
    res.status(500).json({ error: "Failed to generate data." });
  } finally {
    await connection.end();
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
