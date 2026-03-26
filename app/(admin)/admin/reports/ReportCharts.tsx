'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import { Card } from '@/components/ui'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280']

interface Props {
  lostCats: { name: string; value: number }[]
  foundCats: { name: string; value: number }[]
  monthlyData: { month: string; approved: number; rejected: number; pending: number }[]
  claimSummary: { pending: number; approved: number; rejected: number }
}

export default function ReportCharts({ lostCats, foundCats, monthlyData, claimSummary }: Props) {
  const claimPieData = [
    { name: 'Approved', value: claimSummary.approved },
    { name: 'Rejected', value: claimSummary.rejected },
    { name: 'Pending', value: claimSummary.pending },
  ].filter(d => d.value > 0)

  const claimColors = ['#10b981', '#ef4444', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* Monthly Claims Trend */}
      {monthlyData.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Claims Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Claims Status Pie */}
        {claimPieData.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Claim Status Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={claimPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {claimPieData.map((_, i) => <Cell key={i} fill={claimColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Lost Items by Category */}
        {lostCats.length > 0 && (
          <Card className="p-5 lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Lost Items by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={lostCats.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" name="Items" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Found Items by Category */}
      {foundCats.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Found Items by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={foundCats.slice(0, 8)} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" name="Items" fill="#10b981" radius={[4, 4, 0, 0]}>
                {foundCats.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
