import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">{children}</main>
      </div>
    </div>
  )
}
