"use client";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import CandlestickChart, {
  ChartDataset,
  formatChartPrice,
  parseChartCsv,
} from "../components/CandlestickChart";
import TabBook from "../components/tabBook";

type ChartRange = "3m" | "6m" | "1yr" | "all";

const DEFAULT_CHART_DATA = "/graph/chart_20260829T050733.csv";

export default function InvestmentPage() {
  type Category = "Crypto" | "Stock" | "Government Bond" | "Lottery";
  const [shares, setShares] = useState(10);
  const [selectedTab, setSelectedTab] = useState<Category>("Stock");
  const [selectedInvestment, setSelectedInvestment] = useState<number>(0);
  const [isPop, setIsPop] = useState<boolean>(false);
  const [isHelp, setIsHelp] = useState<boolean>(false);
  const [chartRange, setChartRange] = useState<ChartRange>("all");
  const [chartData, setChartData] = useState<ChartDataset | null>(null);
  const [chartFileName, setChartFileName] = useState("chart_20260829T050733.csv");
  const [chartError, setChartError] = useState<string | null>(null);

  const investments: Record<Category, any[]> = {
    Crypto: [
      {
        imageUrl: "graph/stock1.png",
        title: "SKBD Coin",
        symbol: "SKBD",
        price: 30,
      },
      {
        imageUrl: "graph/stock2.png",
        title: "SGMA Coin",
        symbol: "SGMA",
        price: 67,
      },
      {
        imageUrl: "graph/stock3.png",
        title: "DIGE Coin",
        symbol: "DIGE",
        price: 120,
      },
    ],
    Stock: [
      {
        imageUrl: "graph/stock1.png",
        title: "NVIDI Corp (High Risk)",
        symbol: "NVDI",
        price: 109,
      },
      {
        imageUrl: "graph/stock2.png",
        title: "J.K.Mogging (Moderate Risk)",
        symbol: "JKM",
        price: 130,
      },
      {
        imageUrl: "graph/stock3.png",
        title: "Nikola Inc (Low Risk)",
        symbol: "NKLA",
        price: 70,
      },
      {
        imageUrl: "graph/stock1.png",
        title: "SnP 50 (Mutual Funds)",
        symbol: "SNP",
        price: 200,
      },
    ],
    "Government Bond": [
      {
        imageUrl: "graph/stock2.png",
        title: "Yield to Maturity 5 Year",
        symbol: "GOVT YTM 5",
        price: 1000,
      },
      {
        imageUrl: "graph/stock3.png",
        title: "Yield to Maturity 10 Year",
        symbol: "GOVT YTM 10",
        price: 1000,
      },
    ],
    Lottery: [
      {
        imageUrl: "graph/stock1.png",
        title: "Lottery",
        price: 5,
      },
    ],
  };

  useEffect(() => {
    let isCurrent = true;

    async function loadDefaultChart() {
      try {
        const response = await fetch(DEFAULT_CHART_DATA);
        if (!response.ok) throw new Error("The bundled chart CSV could not be loaded.");
        const data = parseChartCsv(await response.text());
        if (isCurrent) setChartData(data);
      } catch (error) {
        if (isCurrent) {
          setChartError(
            error instanceof Error ? error.message : "The chart data could not be loaded."
          );
        }
      }
    }

    void loadDefaultChart();
    return () => {
      isCurrent = false;
    };
  }, []);

  const periodCandles = useMemo(() => {
    if (!chartData) return [];
    if (chartRange === "all") return chartData.candles;

    const months = chartRange === "3m" ? 3 : chartRange === "6m" ? 6 : 12;
    const lastDate = chartData.candles.at(-1)?.date;
    if (!lastDate) return [];
    const periodStart = new Date(lastDate);
    periodStart.setMonth(periodStart.getMonth() - months);
    return chartData.candles.filter((candle) => candle.date >= periodStart);
  }, [chartData, chartRange]);

  async function importChart(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const data = parseChartCsv(await file.text());
      setChartData(data);
      setChartFileName(file.name);
      setChartRange("all");
      setChartError(null);
    } catch (error) {
      setChartError(
        error instanceof Error ? error.message : "That CSV could not be imported."
      );
    }
  }

  return (
    <div className="text-black p-3 flex flex-col items-center">
      {isPop ? (
        <div className="flex flex-col fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] shadow-lg w-4/5 rounded-2xl border-2 border-[#b6b885] bg-white px-4 py-4 items-center gap-2 text-base">
          <h2 className="font-semibold text-center text-3xl">
            {selectedTab} Bought
          </h2>
          You've bought {shares} of{" "}
          {investments[selectedTab][selectedInvestment].symbol}
          <button
            onClick={() => setIsPop(false)}
            className="rounded-full border-2 border-black bg-[#b6b885] px-6 py-1.5"
          >
            Ok
          </button>
        </div>
      ) : (
        ""
      )}
      {isHelp && (
  <div className="flex flex-col fixed left-[50%] top-[50%] z-50 
                  translate-x-[-50%] translate-y-[-50%] shadow-lg 
                  w-4/5 max-h-[70vh] rounded-2xl border-2 border-[#b6b885] 
                  bg-white px-4 py-4 items-center gap-2 text-base 
                  overflow-y-auto">

    <h2 className="font-semibold text-center text-3xl mb-2">
      Guide On Investment
    </h2>

    <p className="text-sm leading-5">
      <strong>1. Know Your Goals:</strong> Are you saving for retirement, a home, or short-term gains? 
      Understanding your objective helps guide your strategy.
    </p>
    <p className="text-sm leading-5">
      <strong>2. Research & Diversify:</strong> Look at a company’s financial health, market trends, 
      and don’t put all your money in one place. Spread out risk across different stocks, bonds, 
      or funds.
    </p>
    <p className="text-sm leading-5">
      <strong>3. Consider Risk Tolerance:</strong> If you prefer stability, stick to lower-volatility 
      investments like bonds or established companies. If you can handle swings, growth stocks or 
      emerging markets might fit.
    </p>
    <p className="text-sm leading-5">
      <strong>4. Think Long-Term:</strong> Markets rise and fall daily. Historically, patient 
      investors who hold quality assets tend to see better results over years, not days.
    </p>
    <p className="text-sm leading-5">
      <strong>5. Keep Emotions in Check:</strong> Avoid panic-selling on dips or chasing quick 
      profits. A disciplined approach often outperforms emotional decisions.
    </p>
    <p className="text-sm leading-5">
      <strong>6. Monitor & Adjust:</strong> Review your portfolio regularly. Rebalance if one 
      investment becomes too large a portion or if your goals change.
    </p>
    <p className="text-sm leading-5 mb-3">
      <em>Tip:</em> Always invest money you can afford to leave invested for a while, and 
      consider seeking professional advice for complex decisions.
    </p>

    <button
      onClick={() => setIsHelp(false)}
      className="rounded-full border-2 border-black bg-[#b6b885] px-6 py-1.5"
    >
      Ok
    </button>
  </div>
)}
      <img
        src="investSign/investSign.png"
        alt="Invest Sign"
        className="relative -top-5 w-[350px]"
      />
      <div className="relative overflow-clip bg-gray-900 text-white py-2 -mt-4 w-[393px]">
        <div className="ticker-container flex whitespace-nowrap w-max">
          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-green-400">APLE</span>
            <span className="text-green-400">&nbsp;▲172.63 1.23%</span>
          </div>
          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-red-400">MSHD</span>
            <span className="text-red-400">&nbsp;▼328.39 0.87%</span>
          </div>
          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-green-400">GAAGL</span>
            <span className="text-green-400">&nbsp;▲138.21 2.15%</span>
          </div>
          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-red-400">AMSN</span>
            <span className="text-red-400">&nbsp;▼178.75 0.42%</span>
          </div>
          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-green-400">NAS</span>
            <span className="text-green-400">&nbsp;▲170.83 3.67%</span>
          </div>

          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-green-400">APLE</span>
            <span className="text-green-400">&nbsp;▲172.63 1.23%</span>
          </div>
          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-red-400">MSHD</span>
            <span className="text-red-400">&nbsp;▼328.39 0.87%</span>
          </div>
          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-green-400">GAAGL</span>
            <span className="text-green-400">&nbsp;▲138.21 2.15%</span>
          </div>
          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-red-400">AMSN</span>
            <span className="text-red-400">&nbsp;▼178.75 0.42%</span>
          </div>
          <div className="ticker-item inline-flex items-center mx-4">
            <span className="font-bold text-green-400">NAS</span>
            <span className="text-green-400">&nbsp;▲170.83 3.67%</span>
          </div>
        </div>
      </div>

      <div className="relative mb-4 mt-2 w-full rounded-lg bg-white p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          {/* <div>
            <p className="text-sm font-bold text-slate-900">
              {investments[selectedTab][selectedInvestment].symbol}
            </p>
          </div>
          <label className="cursor-pointer rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={importChart}
              className="sr-only"
            />
            Import CSV
          </label> */}
        </div>
        <div className="h-[260px] w-full">
          {chartData ? (
            <CandlestickChart
              candles={periodCandles}
              hasOhlc={chartData.hasOhlc}
              symbol={investments[selectedTab][selectedInvestment].symbol}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded bg-slate-950 px-6 text-center text-sm text-slate-300">
              {chartError ?? "Loading chart data…"}
            </div>
          )}
        </div>
      </div>
      <TabBook>
        <div className="book p-4 bg-white rounded-l-xl w-full flex flex-col items-center">
          <div className="mb-4 grow-1 flex flex-col">
            <div className="flex space-x-2 mb-2 items-center text-sm">
              Range
              <button
                onClick={() => setChartRange("3m")}
                className={`ml-1 rounded-xl border px-2 py-1 ${
                  chartRange === "3m" ? "border-slate-900 bg-[#B6B885]" : "bg-white"
                }`}
              >
                3m
              </button>
              <button
                onClick={() => setChartRange("6m")}
                className={`rounded-xl border px-2 py-1 ${
                  chartRange === "6m" ? "border-slate-900 bg-[#B6B885]" : "bg-white"
                }`}
              >
                6m
              </button>
              <button
                onClick={() => setChartRange("1yr")}
                className={`rounded-xl border px-2 py-1 ${
                  chartRange === "1yr" ? "border-slate-900 bg-[#B6B885]" : "bg-white"
                }`}
              >
                1yr
              </button>
              <button
                onClick={() => setChartRange("all")}
                className={`rounded-xl border px-2 py-1 ${
                  chartRange === "all" ? "border-slate-900 bg-[#B6B885]" : "bg-white"
                }`}
              >
                All Time
              </button>
            </div>

            <div className="flex flex-col space-y-2 grow-1 justify-center">
              {Object.entries(investments[selectedTab]).map(
                ([key, value], index) => (
                  <button
                    key={key}
                    className={`${
                      selectedInvestment == index
                        ? `bg-yellow-400`
                        : `bg-[#ffffff]`
                    } font-semibold px-2 py-1 rounded border-1`}
                    onClick={() => setSelectedInvestment(index)}
                  >
                    {value.title}
                  </button>
                )
              )}
            </div>
          </div>
          <div className="mb-2 flex">
            <div className="flex flex-col space-x-2 w-3/5 mr-2">
              <div className="flex space-x-2 w-full mb-2 items-center">
                <span className="text-skin min-w-[84px]">Stop Loss</span>
                <input
                  type="number"
                  id="stopLoss"
                  className="bg-[#ffffff] px-2 py-1 rounded border-1 text-skin w-full"
                  placeholder="$"
                />
              </div>
              <div className="flex space-x-2 w-full  items-center">
                <span className="text-skin min-w-[84px]">Take Profit</span>
                <input
                  type="number"
                  id="takeProfit"
                  className="bg-[#ffffff] px-2 py-1 rounded border-1 text-skin w-full"
                  placeholder="$"
                />
              </div>
            </div>

            <div className="flex flex-col w-2/5 items-center justify-center">
              <span className="px-2 py-1 rounded border-1 text-skin mb-2">
                Amount
              </span>
              <div className="w-full flex justify-center">
                <button
                  className="bg-[#ffffff] px-2 rounded-2xl border-1 w-[35px]"
                  onClick={() => setShares(Math.max(0, shares - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  id="amount"
                  className="bg-[#ffffff] px-2 py-1 rounded border-1 text-skin w-[50px] mx-1"
                  value={shares}
                  onChange={(e) => {
                    if (e.target.value == "") setShares(0);
                    if (parseInt(e.target.value) >= 0)
                      setShares(parseInt(e.target.value));
                  }}
                  min="0"
                  required
                />
                <button
                  className="bg-[#ffffff] px-2 rounded-2xl border-1 w-[35px]"
                  onClick={() => setShares(shares + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          Total: ${shares * investments[selectedTab][selectedInvestment].price}
          <div className="flex space-x-2 mt-2 justify-center text-2xl">
            <button
              className="bg-green-500 text-[#ffffff] border-black py-2 rounded border-1 font-bold w-[70px]"
              onClick={() => {
                if (shares > 0) setIsPop(true);
              }}
            >
              BUY
            </button>
            <button className="bg-red-600 text-[#ffffff] border-black py-2 rounded border-1 font-bold w-[70px]">
              SELL
            </button>
          </div>
        </div>
        <div className="tabs flex flex-col w-[37px]">
          {(Object.keys(investments) as Category[]).map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedTab(category);
                setSelectedInvestment(0);
              }}
              className={`leading-none px-1 border-1 ${
                selectedTab === category ? "bg-[#B6B885]" : "bg-white"
              }`}
            >
              {category == "Government Bond" ? (
                <p>
                  Government
                  <br />
                  Bond
                </p>
              ) : (
                <p>{category}</p>
              )}
            </button>
          ))}
        </div>
      </TabBook>
      <button
        className="absolute right-1 bottom-14 rounded-full flex items-center justify-center cursor-pointer w-6 h-6 bg-[#ffffff] border-black border-2"
        aria-label="Information"
        onClick={() => setIsHelp(true)}
      >
        <span
          style={{
            lineHeight: 1,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ?
        </span>
      </button>
    </div>
  );
}
