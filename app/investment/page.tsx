"use client";
import { useEffect, useMemo, useState } from "react";
import CandlestickChart, {
  ChartDataset,
  formatChartPrice,
  parseChartCsv,
} from "../components/CandlestickChart";
import TabBook from "../components/tabBook";
import { useGame } from "../context/GameProvider";

type ChartRange = "1m" | "3m" | "1yr" | "all";
type Category = "Crypto" | "Stock" | "Government Bond";

type Investment = {
  title: string;
  symbol: string;
  chartPath: string;
};

const investments: Record<Category, Investment[]> = {
  Crypto: [
    {
      title: "Bitcoin",
      symbol: "BTC",
      chartPath: "/graph/crypto/Bitcoin-price-USD.csv",
    },
  ],
  Stock: [
    {
      title: "NVIDIA Corporation",
      symbol: "NVDA",
      chartPath: "/graph/stock/Nvidia 20-26.csv",
    },
    {
      title: "Walmart Inc.",
      symbol: "WMT",
      chartPath: "/graph/stock/Walmart 20-26.csv",
    },
    {
      title: "Visa Inc.",
      symbol: "V",
      chartPath: "/graph/stock/VISA 20-26.csv",
    },
    {
      title: "S&P 500 Index",
      symbol: "S&P 500",
      chartPath: "/graph/stock/S&P500 20-26.csv",
    },
  ],
  "Government Bond": [
    {
      title: "5-Year Government Bond Yield",
      symbol: "US 5Y",
      chartPath: "/graph/bond/5 year government bond.csv",
    },
  ],
};



const chartPaths = Object.values(investments)
  .flat()
  .map((investment) => investment.chartPath);

export default function InvestmentPage() {
  const [shares, setShares] = useState(10);
  const [selectedTab, setSelectedTab] = useState<Category>("Stock");
  const [selectedInvestment, setSelectedInvestment] = useState<number>(0);
  const [isPop, setIsPop] = useState<boolean>(false);
  const [isHelp, setIsHelp] = useState<boolean>(false);
  const [chartRange, setChartRange] = useState<ChartRange>("all");
  const [chartData, setChartData] = useState<Record<string, ChartDataset>>({});
  const [chartError, setChartError] = useState<string | null>(null);
  const [replayDaysBack, setReplayDaysBack] = useState(200);

  const { player, setPlayer, addCosmetic } = useGame();
  
  // Function to update money
  function pay(amount: number) {
    setPlayer((prev) => ({
      ...prev,
      money: prev.money - amount,
    }));
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadChartData() {
      try {
        const loadedData = await Promise.all(
          chartPaths.map(async (chartPath) => {
            const response = await fetch(chartPath);
            if (!response.ok) throw new Error(`Could not load ${chartPath}.`);
            return [chartPath, parseChartCsv(await response.text())] as const;
          }),
        );
        if (isCurrent) setChartData(Object.fromEntries(loadedData));
      } catch (error) {
        if (isCurrent) {
          setChartError(
            error instanceof Error ? error.message : "The chart data could not be loaded.",
          );
        }
      }
    }

    void loadChartData();
    return () => {
      isCurrent = false;
    };
  }, []);

  const sharedLatestDate = useMemo(() => {
    const latestDates = Object.values(chartData)
      .map((dataset) => dataset.candles.at(-1)?.date)
      .filter((date): date is Date => Boolean(date));
    if (latestDates.length !== chartPaths.length) return null;
    return new Date(Math.min(...latestDates.map((date) => date.valueOf())));
  }, [chartData]);

  useEffect(() => {
    if (!sharedLatestDate) return;
    setReplayDaysBack(1825);
  }, [sharedLatestDate]);

  useEffect(() => {
    if (!sharedLatestDate || replayDaysBack === 0) return;

    const replayTimer = window.setTimeout(() => {
      setReplayDaysBack((daysBack) => Math.max(0, daysBack - 1));
    }, 1000);

    return () => window.clearTimeout(replayTimer);
  }, [sharedLatestDate, replayDaysBack]);

  const replayDate = useMemo(() => {
    if (!sharedLatestDate) return null;
    const date = new Date(sharedLatestDate);
    date.setDate(date.getDate() - replayDaysBack);
    return date;
  }, [sharedLatestDate, replayDaysBack]);

  const selectedInvestmentData = investments[selectedTab][selectedInvestment];
  const selectedChartData = chartData[selectedInvestmentData.chartPath] ?? null;

  const replayCandles = useMemo(() => {
    if (!selectedChartData || !replayDate) return [];
    return selectedChartData.candles.filter((candle) => candle.date <= replayDate);
  }, [selectedChartData, replayDate]);

  const periodCandles = useMemo(() => {
    if (!replayCandles.length) return [];
    if (chartRange === "all") return replayCandles;

    const months = chartRange === "1m" ? 1 : chartRange === "3m" ? 3 : 12;
    const lastDate = replayCandles.at(-1)?.date;
    if (!lastDate) return [];
    const periodStart = new Date(lastDate);
    periodStart.setMonth(periodStart.getMonth() - months);
    return replayCandles.filter((candle) => candle.date >= periodStart);
  }, [replayCandles, chartRange]);

  const replayEndDate = replayCandles.at(-1)?.date;
  const selectedPrice = replayCandles.at(-1)?.close ?? null;
  const totalCost = selectedPrice !== null ? shares * selectedPrice : 0;

  return (
    <div className="text-black p-3 flex flex-col items-center">
      {isPop ? (
        <div className="flex flex-col fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] shadow-lg w-4/5 rounded-2xl border-2 border-[#b6b885] bg-white px-4 py-4 items-center gap-2 text-base">
          <h2 className="font-semibold text-center text-3xl">
            {selectedTab} Bought
          </h2>
          <p className="text-center">
            You've bought {shares} of {selectedInvestmentData.symbol} for ${formatChartPrice(totalCost)}
          </p>
          <button
            onClick={() => {
              setIsPop(false);
              pay(totalCost);
            }}
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
          {/* <label .../> omitted for brevity as per your code */}
        </div>
        <div className="w-full">
          {selectedChartData ? (
            <CandlestickChart
              candles={periodCandles}
              hasOhlc={selectedChartData.hasOhlc}
              symbol={selectedInvestmentData.symbol}
              displayEndDate={replayDate ?? undefined}
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
                onClick={() => setChartRange("1m")}
                className={`ml-1 rounded-xl border px-2 py-1 ${
                  chartRange === "1m" ? "border-slate-900 bg-[#B6B885]" : "bg-white"
                }`}
              >
                1m
              </button>
              <button
                onClick={() => setChartRange("3m")}
                className={`rounded-xl border px-2 py-1 ${
                  chartRange === "3m" ? "border-slate-900 bg-[#B6B885]" : "bg-white"
                }`}
              >
                3m
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
          <div className="mt-2 text-center text-sm">
            <span className="font-semibold">Replay price:</span>{" "}
            {selectedPrice === null ? "Loading…" : `$${formatChartPrice(selectedPrice)}`}
          </div>
          <div className="text-center">
            Total: ${selectedPrice === null ? "—" : formatChartPrice(totalCost)}
          </div>
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