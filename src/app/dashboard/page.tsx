import { createClient } from '@/utils/supabase/server'
import { 
  getCachedDashboardStats
} from '@/utils/supabase/cached-queries'
import { DashboardStats } from '@/types/dashboard'
import { StatCard } from '@/components/dashboard/StatCard'
import { SalesOverviewChart } from '@/components/dashboard/SalesOverviewChart'
import { SubscribersChart } from '@/components/dashboard/SubscribersChart'
import { SalesDistributionChart } from '@/components/dashboard/SalesDistributionChart'
import { IntegrationsTable } from '@/components/dashboard/IntegrationsTable'
import { Calendar, Filter, Download } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch stats with Session Security
  const stats = await getCachedDashboardStats(user.id) as DashboardStats

  return (
    <div className="p-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Welcome back, {user?.email?.split('@')[0]}!</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-[15px] font-medium text-slate-600 shadow-sm">
            <Calendar size={20} className="mr-2 text-slate-400" />
            Oct 18 - Nov 18
            <span className="mx-3 text-slate-300">|</span>
            <select className="bg-transparent border-none outline-none font-semibold text-slate-700 cursor-pointer">
              <option>Monthly</option>
            </select>
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-[15px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
            <Filter size={20} className="text-slate-400" />
            Filter
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-[15px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
            <Download size={20} className="text-slate-400" />
            Export
          </button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Page Views" 
          value="12,450" 
          change={15.8} 
          iconName="eye" 
          changeType="positive" 
        />
        <StatCard 
          title="Total Revenue" 
          value={`${Math.round(stats.revenue).toLocaleString('fr-FR')}€`} 
          change={stats.revenue_change} 
          iconName="banknote" 
          changeType={stats.revenue_change >= 0 ? 'positive' : 'negative'} 
        />
        <StatCard 
          title="Bounce Rate" 
          value="86.5%" 
          change={24.2} 
          iconName="lineChart" 
          changeType="positive" 
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SalesOverviewChart />
        <SubscribersChart />
        <SalesDistributionChart />
        <IntegrationsTable />
      </div>
    </div>
  )
}
