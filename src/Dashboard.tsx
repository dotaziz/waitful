import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Filter,
  BarChart3,
  Globe,
  Eye,
  ChevronDown,
  Download,
  History,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  lastVisitTime: number;
  visitCount: number;
  typedCount: number;
}

interface DomainStats {
  domain: string;
  visitCount: number;
  lastVisit: number;
  urls: HistoryItem[];
  title: string;
  favicon: string;
}

interface DailyStats {
  date: string;
  visits: number;
  uniqueDomains: number;
  formattedDate: string;
}

interface DashboardData {
  totalVisits: number;
  totalDomains: number;
  totalPages: number;
  topDomains: DomainStats[];
  dailyStats: DailyStats[];
  recentHistory: HistoryItem[];
  timeRange: string;
}

const BrowsingHistoryDashboard = () => {
  const [data, setData] = useState<DashboardData>({
    totalVisits: 0,
    totalDomains: 0,
    totalPages: 0,
    topDomains: [],
    dailyStats: [],
    recentHistory: [],
    timeRange: "7 days",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("7"); // days
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState<"domains" | "pages">("domains");

  useEffect(() => {
    loadBrowsingHistory();
  }, [dateFilter]);

  const loadBrowsingHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const days = parseInt(dateFilter);
      const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

      // Search Chrome history
      const historyItems = await new Promise<chrome.history.HistoryItem[]>(
        (resolve) => {
          chrome.history.search(
            {
              text: "",
              startTime: startTime,
              maxResults: 10000,
            },
            resolve
          );
        }
      );

      // Process the history data
      const processedData = await processHistoryData(historyItems, days);
      setData(processedData);
    } catch (err) {
      console.error("Error loading browsing history:", err);
      setError(
        "Failed to load browsing history. Make sure the extension has history permissions."
      );
      // Fallback to demo data
      //   setData([{}]);
    } finally {
      setLoading(false);
    }
  };

  const processHistoryData = async (
    historyItems: chrome.history.HistoryItem[],
    days: number
  ): Promise<DashboardData> => {
    // Group by domain
    const domainMap = new Map<string, DomainStats>();
    const dailyStatsMap = new Map<string, DailyStats>();

    // Initialize daily stats
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyStatsMap.set(dateStr, {
        date: dateStr,
        visits: 0,
        uniqueDomains: 0,
        formattedDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      });
    }

    let totalVisits = 0;
    const processedHistory: HistoryItem[] = [];

    for (const item of historyItems) {
      if (!item.url || !item.lastVisitTime) continue;

      try {
        const url = new URL(item.url);
        const domain = url.hostname;
        const visitCount = item.visitCount || 1;
        const typedCount = item.typedCount || 0;

        // Skip chrome:// and extension pages
        if (
          url.protocol === "chrome:" ||
          url.protocol === "chrome-extension:"
        ) {
          continue;
        }

        totalVisits += visitCount;

        const historyItem: HistoryItem = {
          id: item.id || "",
          url: item.url,
          title: item.title || url.pathname,
          lastVisitTime: item.lastVisitTime,
          visitCount,
          typedCount,
        };

        processedHistory.push(historyItem);

        // Update domain stats
        if (!domainMap.has(domain)) {
          domainMap.set(domain, {
            domain,
            visitCount: 0,
            lastVisit: 0,
            urls: [],
            title: domain,
            favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
          });
        }

        const domainStats = domainMap.get(domain)!;
        domainStats.visitCount += visitCount;
        domainStats.lastVisit = Math.max(
          domainStats.lastVisit,
          item.lastVisitTime
        );
        domainStats.urls.push(historyItem);

        // Update daily stats
        const visitDate = new Date(item.lastVisitTime);
        const dateStr = visitDate.toISOString().split("T")[0];
        const dayStats = dailyStatsMap.get(dateStr);
        if (dayStats) {
          dayStats.visits += visitCount;
        }
      } catch (e) {
        // Skip invalid URLs
        continue;
      }
    }

    // Update unique domains per day
    dailyStatsMap.forEach((dayStats, dateStr) => {
      const domainsForDay = new Set<string>();
      processedHistory.forEach((item) => {
        const itemDate = new Date(item.lastVisitTime)
          .toISOString()
          .split("T")[0];
        if (itemDate === dateStr) {
          try {
            const domain = new URL(item.url).hostname;
            domainsForDay.add(domain);
          } catch (e) {
            // Skip invalid URLs
          }
        }
      });
      dayStats.uniqueDomains = domainsForDay.size;
    });

    // Sort domains by visit count
    const topDomains = Array.from(domainMap.values())
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 20);

    // Sort recent history
    const recentHistory = processedHistory
      .sort((a, b) => b.lastVisitTime - a.lastVisitTime)
      .slice(0, 50);

    // Convert daily stats to array and sort by date
    const dailyStats = Array.from(dailyStatsMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      totalVisits,
      totalDomains: domainMap.size,
      totalPages: processedHistory.length,
      topDomains,
      dailyStats,
      recentHistory,
      timeRange: `${days} days`,
    };
  };

  //   const getDemoData = (): DashboardData => {
  //     const domains = [
  //       { name: 'google.com', visits: 156 },
  //       { name: 'youtube.com', visits: 89 },
  //       { name: 'github.com', visits: 67 },
  //       { name: 'stackoverflow.com', visits: 45 },
  //       { name: 'twitter.com', visits: 34 },
  //       { name: 'reddit.com', visits: 28 },
  //       { name: 'linkedin.com', visits: 23 },
  //       { name: 'facebook.com', visits: 19 },
  //       { name: 'wikipedia.org', visits: 15 },
  //       { name: 'amazon.com', visits: 12 }
  //     ];

  //     const topDomains: DomainStats[] = domains.map(d => ({
  //       domain: d.name,
  //       visitCount: d.visits,
  //       lastVisit: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
  //       urls: [],
  //       title: d.name,
  //       favicon: `https://www.google.com/s2/favicons?domain=${d.name}&sz=32`
  //     }));

  //     const dailyStats: DailyStats[] = Array.from({ length: 7 }, (_, i) => {
  //       const date = new Date();
  //       date.setDate(date.getDate() - (6 - i));
  //       return {
  //         date: date.toISOString().split('T')[0],
  //         visits: Math.floor(Math.random() * 100) + 20,
  //         uniqueDomains: Math.floor(Math.random() * 20) + 5,
  //         formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  //       };
  //     });

  //     return {
  //       totalVisits: domains.reduce((sum, d) => sum + d.visits, 0),
  //       totalDomains: domains.length,
  //       totalPages: 523,
  //       topDomains,
  //       dailyStats,
  //       recentHistory: [],
  //       timeRange: '7 days'
  //     };
  //   };

  const filteredDomains = data.topDomains.filter(
    (domain) =>
      domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      timeRange: data.timeRange,
      summary: {
        totalVisits: data.totalVisits,
        totalDomains: data.totalDomains,
        totalPages: data.totalPages,
      },
      topDomains: data.topDomains,
      dailyStats: data.dailyStats,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `browsing-history-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#F97316",
    "#06B6D4",
  ];

  const pieChartData = data.topDomains.slice(0, 8).map((domain) => ({
    name: domain.domain,
    value: domain.visitCount,
  }));

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl border border-gray-200"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-gray-900">
            Browsing History Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Your browsing patterns and website visits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Last {dateFilter} days
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                {["7", "14", "30", "90"].map((days) => (
                  <button
                    key={days}
                    onClick={() => {
                      setDateFilter(days);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      dateFilter === days
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    Last {days} days
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={loadBrowsingHistory}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            <History className="w-4 h-4" />
            {loading ? "Loading..." : "Refresh"}
          </button>

          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <div className="w-4 h-4 rounded-full bg-red-200"></div>
            <span className="font-medium">Error loading history</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Visits</h3>
            <Eye className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {data.totalVisits.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">in {data.timeRange}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Unique Domains
            </h3>
            <Globe className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {data.totalDomains}
          </div>
          <div className="text-xs text-gray-500 mt-2">websites visited</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Pages</h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {data.totalPages}
          </div>
          <div className="text-xs text-gray-500 mt-2">unique pages</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Avg Daily Visits
            </h3>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {Math.round(data.totalVisits / parseInt(dateFilter))}
          </div>
          <div className="text-xs text-gray-500 mt-2">visits per day</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Daily Browsing Activity
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Visits"
                />
                <Area
                  type="monotone"
                  dataKey="uniqueDomains"
                  stackId="2"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Unique Domains"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Domains Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Top Domains
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, "Visits"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {pieChartData.slice(0, 5).map((site, index) => (
              <div key={site.name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-600 truncate flex-1">
                  {site.name}
                </span>
                <span className="font-medium text-gray-900">{site.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Domains List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Most Visited Websites
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Globe className="w-4 h-4" />
              {filteredDomains.length} domains
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredDomains.map((domain, index) => (
            <div
              key={domain.domain}
              className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-sm font-medium text-gray-400 w-8">
                  #{index + 1}
                </div>
                <div className="flex-shrink-0">
                  <img
                    src={domain.favicon}
                    alt={`${domain.domain} favicon`}
                    className="w-8 h-8 rounded"
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiA4QzEzLjggOCAxMiA5LjggMTIgMTJWMjBDMTIgMjIuMiAxMy44IDI0IDE2IDI0QzE4LjIgMjQgMjAgMjIuMiAyMCAyMFYxMkMyMCA5LjggMTguMiA4IDE2IDhaIiBmaWxsPSIjNjU3Mzg0Ii8+Cjwvc3ZnPgo=";
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {domain.domain}
                    </h3>
                    <button
                      onClick={() =>
                        window.open(`https://${domain.domain}`, "_blank")
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Last visit:{" "}
                    {new Date(domain.lastVisit).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-900">
                    {domain.visitCount}
                  </div>
                  <div className="text-xs text-gray-500">visits</div>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        data.topDomains[0]
                          ? (domain.visitCount /
                              data.topDomains[0].visitCount) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDomains.length === 0 && !loading && (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No browsing history found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? "No domains match your search."
                : "Start browsing to see your history here."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Visit Distribution Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Visit Distribution
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topDomains.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="domain"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                formatter={(value: any) => [value, "Visits"]}
                labelFormatter={(label: any) => `Domain: ${label}`}
              />
              <Bar dataKey="visitCount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BrowsingHistoryDashboard;
