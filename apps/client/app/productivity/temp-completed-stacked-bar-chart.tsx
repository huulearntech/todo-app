"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig: ChartConfig = {
  completed: {
    label: "cat1",
    color: "var(--chart-1)",
  },
  remaining: {
    label: "cat2",
    color: "var(--chart-2)",
  },
};


const mockData = [
  { name: "Task 1", cat1: 4, cat2: 16 },
  { name: "Task 2", cat1: 7, cat2: 3  },
  { name: "Task 3", cat1: 5, cat2: 5  },
  { name: "Task 4", cat1: 8, cat2: 2  },
];

export default function TempCompletedStackedBarChart() {
  const data = mockData.map((item) => ({
    ...item,
    total: item.cat1 + item.cat2,
    // NOTE: should this be calculated in the backend? or is it okay to calculate it here?
  }));

  return (
    <ChartContainer config={chartConfig} className="w-full max-w-2xl">
      <BarChart
        accessibilityLayer
        width={500}
        height={300}
        layout="vertical"
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" />
        <Tooltip />
        <Legend />
        <Bar dataKey="cat1" stackId="a" fill="#8884d8" />
        <Bar dataKey="cat2" stackId="a" fill="#82ca9d">
          <LabelList dataKey="total" position="right" offset={10}/>
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// import { useMemo, useState, useEffect } from 'react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
// import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

// export default function DynamicServerChart() {
//   const [serverData, setServerData] = useState<
//   { date: string; topItems: { name: string; count: number }[] }[]
//   >([]);
//   const [colorPalette, setColorPalette] = useState<Record<string, string>>({}); // e.g., { 'Apples': '#FF4D4D', 'Bananas': '#FFD700' }
//   const [loading, setLoading] = useState(true);

//   // Simulate fetching both the chart data and the item color configurations from your API
//   useEffect(() => {
//     async function fetchData() {
//       // Replace with your real API endpoints:
//       // const dataRes = await fetch('/api/weekly-data');
//       // const configRes = await fetch('/api/item-colors');
      
//       const mockWeeklyData = [
//         { date: 'Mon', topItems: [{ name: 'Apples', count: 12 }, { name: 'Bananas', count: 10 }] },
//         { date: 'Tue', topItems: [{ name: 'Bananas', count: 15 }, { name: 'Oranges', count: 8 }] },
//         { date: 'Wed', topItems: [{ name: 'Apples', count: 18 }, { name: 'Cherries', count: 5 }] },
//       ];

//       const mockColorPalette: Record<string, string> = {
//         'Apples': '#ef4444',   // Tailwind red-500
//         'Bananas': '#eab308',  // Tailwind yellow-500
//         'Oranges': '#f97316',  // Tailwind orange-500
//         'Cherries': '#ec4899', // Tailwind pink-500
//       };

//       setServerData(mockWeeklyData);
//       setColorPalette(mockColorPalette);
//       setLoading(false);
//     }
//     fetchData();
//   }, []);

//   // 1. Process data and dynamically generate shadcn's chartConfig
//   const { chartData, uniqueItems, chartConfig } = useMemo(() => {
//     if (serverData.length === 0) return { chartData: [], uniqueItems: [], chartConfig: {} };

//     const itemKeys = new Set<string>();
    
//     // Flatten your weekly data structures for Recharts row requirements
//     const formattedData = serverData.map(day => {
//       const row: {date: string; [key: string]: string | number} = { date: day.date };
//       day.topItems.forEach(item => {
//         row[item.name] = item.count;
//         itemKeys.add(item.name);
//       });
//       return row;
//     });

//     const itemsArray = Array.from(itemKeys);

//     // Build the dynamic shadcn configuration object
//     const dynamicConfig: Record<string, {label: string; color: string}> = {};
//     itemsArray.forEach(itemName => {
//       dynamicConfig[itemName] = {
//         label: itemName,
//         // Fallback to a gray shade if the server misses a color mapping rule
//         color: colorPalette[itemName] || '#94a3b8', 
//       };
//     });

//     return { 
//       chartData: formattedData, 
//       uniqueItems: itemsArray, 
//       chartConfig: dynamicConfig 
//     };
//   }, [serverData, colorPalette]);

//   if (loading) return <div>Loading dynamic chart...</div>;

//   return (
//     // 2. Pass your dynamic runtime config right into the shadcn ChartContainer
//     <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
//       <BarChart accessibilityLayer data={chartData}>
//         <CartesianGrid strokeDasharray="3 3" vertical={false} />
//         <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
//         <YAxis tickLine={false} axisLine={false} />
        
//         {/* Shadcn's theme-aware automated Tooltip and Legend configs */}
//         <ChartTooltip content={<ChartTooltipContent />} />
//         {/* <ChartLegend content={<ChartLegendContent />} /> */}

//         {/* 3. Dynamically map bars using the colors directly from your built config */}
//         {uniqueItems.map((itemName) => (
//           <Bar
//             key={itemName}
//             dataKey={itemName}
//             stackId="a"
//             // Use your runtime computed color value directly
//             fill={chartConfig[itemName]?.color} 
//             radius={[0, 0, 0, 0]} // Customizing bar edges if needed
//           />
//         ))}
//       </BarChart>
//     </ChartContainer>
//   );
// }
