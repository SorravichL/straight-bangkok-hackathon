"use client";

import { useState } from "react";
import "./outcome.css";
import { useGame } from "../context/GameProvider";
import { useRouter } from "next/navigation";

export default function YearReview() {
  const [year, setYear] = useState(32);

  const { player, setPlayer } = useGame();
  const router = useRouter();
  function end() {
    setPlayer((prev) => ({
      ...prev,
      // Increase money by `amount`
      age: prev.age + 1,
    }));
    router.push("/leaderboard");
  }

  const income = [
    { item: "Salary", lastYear: 100, thisYear: 120 },
    { item: "Investment Sold", lastYear: 7, thisYear: 2 },
    { item: "Events", lastYear: 1, thisYear: 2 },
  ];

  const expenses = [
    { item: "Accommodation", lastYear: 20, thisYear: 24 },
    { item: "Food", lastYear: 5, thisYear: 7 },
    { item: "Transport", lastYear: 4, thisYear: 2 },
    { item: "Insurance", lastYear: 10, thisYear: 18 },
    { item: "Loan Payment", lastYear: 2, thisYear: 2 },
    { item: "Assets", lastYear: 0, thisYear: 45 },
    { item: "Investment Bought", lastYear: 10, thisYear: 8 },
    { item: "Tutor", lastYear: 10, thisYear: 10 },
    { item: "Travel", lastYear: 20, thisYear: 20 },
    { item: "Events", lastYear: 3, thisYear: 1 },
  ];

  const stats = [
    { item: "Net Worth", lastYear: 120, thisYear: 135 },
    { item: "Knowledge", lastYear: 16, thisYear: 18 },
    { item: "Happiness", lastYear: 27, thisYear: 35 },
  ];

  const totalIncomeThisYear = income.reduce(
    (sum, item) => sum + item.thisYear,
    0
  );

  const totalExpensesThisYear = expenses.reduce(
    (sum, item) => sum + item.thisYear,
    0
  );

  const totalStatsThisYear = stats.reduce(
    (sum, item) => sum + item.thisYear,
    0
  );

  const totalIncomeLastYear = income.reduce(
    (sum, item) => sum + item.lastYear,
    0
  );

  const totalExpensesLastYear = expenses.reduce(
    (sum, item) => sum + item.lastYear,
    0
  );

  const totalStatsLastYear = stats.reduce(
    (sum, item) => sum + item.lastYear,
    0
  );

  return (
    <div>
      <div className="head2">
        <div className="topic2">Outcome</div>
        <div className="topic2">⌛️3/9</div>
      </div>

      <div className="container2">
        <h2 className="title2">Year {year} Review</h2>

        <div className="mt-2 w-full  flex flex-col items-center">
          <h3 className="text-base font-semibold">Income</h3>
          <table className="w-full border-collapse text-xs shadow-lg">
            <thead>
              <tr className="bg-[#D8D8AA]">
                <th className="border p-2 w-[38%]">Item</th>
                <th className="border p-2">Last Year</th>
                <th className="border p-2 w-[38%]">This Year</th>
              </tr>
            </thead>
            <tbody>
              {income.map((row, index) => (
                <tr key={index} className="text-center">
                  <td className="border p-2">{row.item}</td>
                  <td className="border p-2">{row.lastYear}k</td>
                  <td
                    className={`border p-2 ${
                      (row.lastYear == 0
                        ? 1
                        : Math.round(
                            (100.0 * row.thisYear) / row.lastYear - 100
                          )) < 0
                        ? "text-red-500"
                        : "text-black"
                    }`}
                  >
                    {`${row.thisYear}k
                      (${row.thisYear - row.lastYear >= 0 ? "▲" : "▼"}${
                      row.lastYear == 0
                        ? 1
                        : Math.round(
                            (100.0 * row.thisYear) / row.lastYear - 100
                          )
                    }
                      %)`}
                  </td>
                </tr>
              ))}
              <tr key={income.length} className="text-center">
                <td className="border p-2">Total</td>
                <td className="border p-2">{totalIncomeLastYear}k</td>
                <td
                  className={`border p-2 ${
                    (totalIncomeLastYear == 0
                      ? 1
                      : Math.round(
                          (100.0 * totalIncomeThisYear) / totalIncomeLastYear -
                            100
                        )) < 0
                      ? "text-red-500"
                      : "text-black"
                  }`}
                >
                  {`${totalIncomeThisYear}k
                      (${
                        totalIncomeThisYear - totalIncomeLastYear >= 0
                          ? "▲"
                          : "▼"
                      }${
                    totalIncomeLastYear == 0
                      ? 1
                      : Math.round(
                          (100.0 * totalIncomeThisYear) / totalIncomeLastYear -
                            100
                        )
                  }
                      %)`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-2 w-full  flex flex-col items-center">
          <h3 className="text-base font-semibold">Expense</h3>
          <table className="w-full border-collapse border text-xs shadow-lg">
            <thead>
              <tr className="bg-[#D8D8AA]">
                <th className="border p-2 w-[38%]">Item</th>
                <th className="border p-2">Last Year</th>
                <th className="border p-2 w-[38%]">This Year</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((row, index) => (
                <tr key={index} className="text-center">
                  <td className="border p-2">{row.item}</td>
                  <td className="border p-2">{row.lastYear}k</td>
                  <td
                    className={`border p-2 ${
                      (row.lastYear == 0
                        ? 1
                        : Math.round(
                            (100.0 * row.thisYear) / row.lastYear - 100
                          )) < 0
                        ? "text-red-500"
                        : "text-black"
                    }`}
                  >
                    {`${row.thisYear}k
                      (${row.thisYear - row.lastYear >= 0 ? "▲" : "▼"}${
                      row.lastYear == 0
                        ? 1
                        : Math.round(
                            (100.0 * row.thisYear) / row.lastYear - 100
                          )
                    }
                      %)`}
                  </td>
                </tr>
              ))}
              <tr key={income.length} className="text-center">
                <td className="border p-2">Total</td>
                <td className="border p-2">{totalExpensesLastYear}k</td>
                <td
                  className={`border p-2 ${
                    (totalExpensesLastYear == 0
                      ? 1
                      : Math.round(
                          (100.0 * totalExpensesThisYear) /
                            totalExpensesLastYear -
                            100
                        )) < 0
                      ? "text-red-500"
                      : "text-black"
                  }`}
                >
                  {`${totalExpensesThisYear}k
                      (${
                        totalExpensesThisYear - totalExpensesLastYear >= 0
                          ? "▲"
                          : "▼"
                      }${
                    totalExpensesLastYear == 0
                      ? 1
                      : Math.round(
                          (100.0 * totalExpensesThisYear) /
                            totalExpensesLastYear -
                            100
                        )
                  }
                      %)`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-2 w-full  flex flex-col items-center ">
          <h3 className="text-base font-semibold">Stats</h3>
          <table className="w-full border-collapse border text-xs shadow-lg">
            <thead>
              <tr className="bg-[#D8D8AA]">
                <th className="border p-2 w-[38%]">Item</th>
                <th className="border p-2">Last Year</th>
                <th className="border p-2 w-[38%]">This Year</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row, index) => (
                <tr key={index} className="text-center">
                  <td className="border p-2">{row.item}</td>
                  <td className="border p-2">{row.lastYear}k</td>
                  <td
                    className={`border p-2 ${
                      (row.lastYear == 0
                        ? 1
                        : Math.round(
                            (100.0 * row.thisYear) / row.lastYear - 100
                          )) < 0
                        ? "text-red-500"
                        : "text-black"
                    }`}
                  >
                    {`${row.thisYear}k
                      (${row.thisYear - row.lastYear >= 0 ? "▲" : "▼"}${
                      row.lastYear == 0
                        ? 1
                        : Math.round(
                            (100.0 * row.thisYear) / row.lastYear - 100
                          )
                    }
                      %)`}
                  </td>
                </tr>
              ))}
              <tr key={income.length} className="text-center">
                <td className="border p-2">Total</td>
                <td className="border p-2">{totalStatsLastYear}k</td>
                <td
                  className={`border p-2 ${
                    (totalStatsLastYear == 0
                      ? 1
                      : Math.round(
                          (100.0 * totalStatsThisYear) / totalStatsLastYear -
                            100
                        )) < 0
                      ? "text-red-500"
                      : "text-black"
                  }`}
                >
                  {`${totalStatsThisYear}k
                      (${
                        totalStatsThisYear - totalStatsLastYear >= 0 ? "▲" : "▼"
                      }${
                    totalStatsLastYear == 0
                      ? 1
                      : Math.round(
                          (100.0 * totalStatsThisYear) / totalStatsLastYear -
                            100
                        )
                  }
                      %)`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          className="mt-4 w-full  bg-[#81B64C] text-white py-2 rounded-lg"
          onClick={() => end()}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
