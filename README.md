# Are The Bridges Fucked? .CA 🌉🤷‍♂️

![Status](https://img.shields.io/badge/Status-Fucked%3F-red) ![License](https://img.shields.io/badge/license-MIT-blue) ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange) ![React](https://img.shields.io/badge/React-19-blue)

Welcome to the **unofficial**, **unfiltered**, and essential tool for every Haligonian's commute. This modern web application answers the one question that matters: **"Can I get across the harbour, or should I just go home?"**

## 🚀 Features

*   **Real-time Traffic Interpretation**: We scrape the official bridge data and translate it into human terms (e.g., "YES", "NO", "ALMOST").
*   **Weather Integration**: Real-time weather conditions from Environment Canada, because rain makes Halifax drivers forget how to drive.
*   **Active Alert System**: integrated severe weather warnings (Snowfall, Wind, Hurricanes) that visually take over the UI when things get serious.
*   **Live Camera Feeds**: See the parking lot for yourself with direct feeds from the bridge cameras.
*   **Maritimer Wisdom**: Context-aware sayings that pop up when the weather is "rough" or "apocalyptic".
*   **Blazing Fast**: Built on Cloudflare Workers for edge-native performance.
*   **Mobile First**: Designed to be used on your phone before you even leave the driveway.

## 🛠️ Tech Stack

This project is built with a modern, edge-native stack:

*   **Frontend**: React 19, TypeScript, Vite
*   **Backend**: Cloudflare Workers (TypeScript)
    *   *Worker functions as a proxy for both Weather (JSON) and Traffic (HTML) data to bypass CORS and add caching.*
*   **Styling**: Pure CSS Variables & modern responsive design (No heavy frameworks like Tailwind).
*   **Deployment**: Cloudflare Pages / Workers.

## 🏁 Getting Started

### Prerequisites

*   Node.js (v20 or later)
*   npm or pnpm

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/your-username/are-the-bridges-fucked.ca.git
    cd are-the-bridges-fucked.ca
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run locally**
    ```bash
    npm run dev
    ```
    The app will start at `http://localhost:5173`. The local development server proxies API requests to the real external services.

## 🌩️ Cloudflare Worker Development

To test the edge functions (proxies) locally:

```bash
# Run the worker locally
npm run dev:worker
```

The worker handles:
*   `/api/alerts` -> Proxies `weather.gc.ca`
*   `/api/traffic` -> Proxies `halifaxharbourbridges.ca`
*   `/*` -> Serves static assets (React App)

## 🚢 Deployment

This project is configured for **Cloudflare Workers** with static asset serving.

1.  **Build the project**
    ```bash
    npm run build
    ```

2.  **Deploy to Cloudflare**
    ```bash
    # Login to Cloudflare (first time only)
    npx wrangler login

    # Deploy
    npx wrangler deploy
    ```

## 🤝 Contributing

We welcome contributions from fellow bridge-fearing Haligonians!

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

Please ensure your code follows the existing style (TypeScript, functional React components, CSS variables).

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The code is open source, but the attitude is proprietary to Nova Scotia.

## 🙏 Credits & Attribution

*   **Bridge Data**: Sourced from [Halifax Harbour Bridges](https://halifaxharbourbridges.ca/). We are not affiliated with HHB, we just consume their HTML.
*   **Weather Data**: Sourced from [Environment Canada](https://weather.gc.ca/) Datamart.
*   **Icons**: Weather icons and UI elements designed for clarity and aesthetic.

---

