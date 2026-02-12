import { Layout } from './components/Layout'
import { useLocalStorage } from './hooks/useLocalStorage'
// Module A
import { FDCalculator } from './modules/deposits/FDCalculator'
import { RDCalculator } from './modules/deposits/RDCalculator'
import { MISCalculator } from './modules/deposits/MISCalculator'
import { QISCalculator } from './modules/deposits/QISCalculator'
// Module B
import { EMICalculator } from './modules/loans/EMICalculator'
import { LoanCompare } from './modules/loans/LoanCompare'
import { TakeoverCalculator } from './modules/loans/TakeoverCalculator'
import { ReverseLoanCalculator } from './modules/loans/ReverseLoanCalculator'
import { GoldLoanCalculator } from './modules/loans/GoldLoanCalculator'
import { KCCCalculator } from './modules/loans/KCCCalculator'

// Module C
import { WorkingCapitalCalculator } from './modules/msme/WorkingCapital'
import { DrawingPowerCalculator } from './modules/msme/DrawingPower'
import { RatioCalculator } from './modules/msme/RatioCalculator'
import { FeesCalculator } from './modules/msme/FeesCalculator'

// Module D
import { GSTCalculator } from './modules/utilities/GSTCalculator'
import { DateCalculator } from './modules/utilities/DateCalculator'
import { UnitConverter } from './modules/utilities/UnitConverter'
import { CashCounter } from './modules/utilities/CashCounter'

function App() {
  const [activeModule, setActiveModule] = useLocalStorage<string>('activeModule', 'deposits')
  const [activeCalculator, setActiveCalculator] = useLocalStorage<string>('activeCalculator', 'fd')

  const handleNavigate = (moduleId: string, calculatorId: string) => {
    setActiveModule(moduleId)
    setActiveCalculator(calculatorId)
  }

  const renderContent = () => {
    // Module A: Deposits
    if (activeModule === 'deposits') {
      switch (activeCalculator) {
        case 'fd': return <FDCalculator />;
        case 'rd': return <RDCalculator />;
        case 'mis': return <MISCalculator />;
        case 'qis': return <QISCalculator />;
        default: return <FDCalculator />;
      }
    }

    // Module B: Loans
    if (activeModule === 'loans') {
      switch (activeCalculator) {
        case 'emi': return <EMICalculator />;
        case 'loan-compare': return <LoanCompare />;
        case 'takeover': return <TakeoverCalculator />;
        case 'reverse': return <ReverseLoanCalculator />;
        case 'gold': return <GoldLoanCalculator />;
        case 'kcc': return <KCCCalculator />;
        default: return <EMICalculator />;
      }
    }

    // Module C: MSME
    if (activeModule === 'msme') {
      switch (activeCalculator) {
        case 'working-capital': return <WorkingCapitalCalculator />;
        case 'drawing-power': return <DrawingPowerCalculator />;
        case 'ratios': return <RatioCalculator />;
        case 'fees': return <FeesCalculator />;
        default: return <WorkingCapitalCalculator />;
      }
    }

    // Module D: Utilities
    if (activeModule === 'utilities') {
      switch (activeCalculator) {
        case 'gst': return <GSTCalculator />;
        case 'date': return <DateCalculator />;
        case 'converter': return <UnitConverter />;
        case 'cash-counter': return <CashCounter />;
        default: return <GSTCalculator />;
      }
    }

    // Default fallthrough
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-2">Module: {activeModule}</h2>
        <p>Calculator: {activeCalculator}</p>
        <p className="mt-4 text-sm">Select a calculator from the sidebar.</p>
      </div>
    )
  }

  return (
    <Layout
      activeModule={activeModule}
      activeCalculator={activeCalculator}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </Layout>
  )
}

export default App
