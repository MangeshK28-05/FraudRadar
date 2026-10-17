# FraudRadar 

A real-time fraud detection dashboard that streams fake bank transactions, scores them for risk, and visualizes suspicious account clusters.

## What it does

- Streams a transaction every 10 seconds
- Scores each transaction using behavioral rules (large amount, rapid fire, chain transfers)
- Flags suspicious ones as alerts with human-readable reasons
- Visualizes account connections as a live force graph
- Analysts can confirm or dismiss alerts

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO, MongoDB (Mongoose)
- **Frontend:** React, Vite, Tailwind CSS, react-force-graph-2d
- **Real-time:** Socket.IO

## Run locally

1. Clone the repo
2. Create a `.env` file in the root:
