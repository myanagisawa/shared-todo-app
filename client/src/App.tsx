import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            Shared Todo App
          </h1>
          <p className="text-gray-600 mb-8">
            Multiple device synchronized simple task management
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Development Mode</h2>
            <div className="space-y-4">
              <button
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded transition-colors"
                onClick={() => setCount((count) => count + 1)}
              >
                Count is {count}
              </button>
              
              <div className="text-sm text-gray-500">
                <p>Frontend: React + Vite + TypeScript</p>
                <p>Backend: Node.js + Express + Prisma</p>
                <p>Database: PostgreSQL</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-xs text-gray-400">
            Phase 1 Development Environment
          </div>
        </div>
      </div>
    </div>
  )
}

export default App