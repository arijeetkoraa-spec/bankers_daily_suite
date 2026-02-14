import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Tractor, FileDown, RotateCcw, Plus, Trash2, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { exportToPDF, renderTable } from '../../lib/pdf/export';
import { formatIndianCurrency, numberToIndianWords, formatPdfCurrency } from '../../lib/utils';

// Constants
const CROP_OPTIONS = [
    'Paddy', 'Wheat', 'Maize', 'Sugarcane', 'Cotton', 'Groundnut',
    'Potato', 'Soybean', 'Millets', 'Pulses', 'Vegetables', 'Fruits',
    'Boro Paddy', 'Aman Paddy', 'Other'
];

interface Crop {
    id: string;
    type: string;
    customName?: string;
    scaleOfFinance: number;
    area: number;
}

interface TermLoan {
    id: string;
    year: number;
    description: string;
    amount: number;
}

export const KCCCalculator: React.FC = () => {
    // Basic Inputs
    const [landUnit, setLandUnit] = useLocalStorage<'Acres' | 'Hectares'>('kcc_unit', 'Acres');
    const [farmerType, setFarmerType] = useLocalStorage<string>('kcc_farmer_type', 'Owner Cultivator');
    const [isMultiCrop, setIsMultiCrop] = useLocalStorage<boolean>('kcc_is_multi', false);

    // Legacy single crop inputs (kept for simple mode)
    const [singleLandHolding, setSingleLandHolding] = useLocalStorage<string>('kcc_land', '5');
    const [singleCropType, setSingleCropType] = useLocalStorage<string>('kcc_crop', 'Paddy');
    const [singleScale, setSingleScale] = useLocalStorage<string>('kcc_scale', '35000');

    // Advanced Inputs
    const [crops, setCrops] = useLocalStorage<Crop[]>('kcc_crops', [
        { id: '1', type: 'Paddy', scaleOfFinance: 35000, area: 2 }
    ]);
    const [termLoans, setTermLoans] = useLocalStorage<TermLoan[]>('kcc_term_loans', []);

    // Parameters
    const [postHarvestPercent, setPostHarvestPercent] = useLocalStorage<string>('kcc_param_ph', '10');
    const [maintenancePercent, setMaintenancePercent] = useLocalStorage<string>('kcc_param_maint', '20');
    const [escalationPercent, setEscalationPercent] = useLocalStorage<string>('kcc_param_esc', '10');
    const [insurancePremium, setInsurancePremium] = useLocalStorage<string>('kcc_param_ins', '0');

    // UI State
    const [showParams, setShowParams] = useState(false);

    // -- LOGIC --

    // 1. Land Conversion & Category
    const getTotalAreaAcres = () => {
        if (!isMultiCrop) {
            const val = parseFloat(singleLandHolding) || 0;
            return landUnit === 'Hectares' ? val * 2.471 : val;
        }
        const totalCropArea = crops.reduce((sum, c) => sum + (c.area || 0), 0);
        return landUnit === 'Hectares' ? totalCropArea * 2.471 : totalCropArea;
    };

    const totalAcres = getTotalAreaAcres();
    const totalHectares = totalAcres / 2.471;

    let farmerCategory = "Other";
    if (totalHectares <= 1) farmerCategory = "Marginal";
    else if (totalHectares <= 2) farmerCategory = "Small";

    // 2. Base Cost Calculation
    let baseCultivationCost = 0;
    if (!isMultiCrop) {
        baseCultivationCost = (parseFloat(singleLandHolding) || 0) * (parseFloat(singleScale) || 0);
    } else {
        baseCultivationCost = crops.reduce((sum, c) => sum + (c.area * c.scaleOfFinance), 0);
    }

    // 3. Components
    const phPercent = parseFloat(postHarvestPercent) || 0;
    const maintPercent = parseFloat(maintenancePercent) || 0;
    const insPremium = parseFloat(insurancePremium) || 0;
    const escPercent = parseFloat(escalationPercent) || 0;

    const postHarvestAmt = baseCultivationCost * (phPercent / 100);
    const maintenanceAmt = baseCultivationCost * (maintPercent / 100);

    // Year 1 Limit
    // For Marginal Farmers, banks often use a lump sum or flexible limit, but circulars allow
    // standard formula if beneficial. We'll use standard formula but flag it.
    const year1Limit = baseCultivationCost + postHarvestAmt + maintenanceAmt + insPremium;

    // 4. Yearly Projections
    interface Projection {
        year: number;
        shortTermLimit: number;
        termLoan: number;
        totalDrawable: number;
    }
    const projections: Projection[] = [];
    let currentLimit = year1Limit;

    // Component breakdown for reporting
    const year1Components = {
        base: baseCultivationCost,
        ph: postHarvestAmt,
        maint: maintenanceAmt,
        ins: insPremium
    };

    for (let year = 1; year <= 5; year++) {
        // Term loans for this year
        const yearTermLoans = termLoans.filter(t => t.year === year).reduce((sum, t) => sum + (t.amount || 0), 0);

        // Short Term Limit (escalates from Year 2 onwards)
        // Logic: Year N = Year (N-1) + 10% of Year (N-1) -> Cumulative
        if (year > 1) {
            currentLimit = currentLimit + (currentLimit * (escPercent / 100));
        }

        projections.push({
            year,
            shortTermLimit: currentLimit,
            termLoan: yearTermLoans,
            totalDrawable: currentLimit + yearTermLoans
        });
    }

    // 5. Total Sanction (MPL)
    // MPL = 5th Year Short Term Limit + Total Term Loans (for 5 years)
    const year5ShortTerm = projections[4].shortTermLimit;
    const totalTermLoanAmt = termLoans.reduce((sum, t) => sum + (t.amount || 0), 0);
    const maxPermissibleLimit = year5ShortTerm + totalTermLoanAmt;
    const limitWords = numberToIndianWords(Math.round(maxPermissibleLimit));

    // -- HANDLERS --

    const handleUnitChange = (newUnit: 'Acres' | 'Hectares') => {
        if (newUnit === landUnit) return;

        const conversionFactor = newUnit === 'Hectares' ? (1 / 2.471) : 2.471;

        // Convert single mode
        if (singleLandHolding) {
            setSingleLandHolding((parseFloat(singleLandHolding) * conversionFactor).toFixed(2));
        }
        if (singleScale) {
            setSingleScale((parseFloat(singleScale) / conversionFactor).toFixed(0));
        }

        // Convert multi mode
        setCrops(crops.map(c => ({
            ...c,
            area: parseFloat((c.area * conversionFactor).toFixed(2)),
            scaleOfFinance: Math.round(c.scaleOfFinance / conversionFactor)
        })));

        setLandUnit(newUnit);
    };

    const addCrop = () => {
        const defaultArea = landUnit === 'Acres' ? 2 : 0.8;
        const defaultScale = landUnit === 'Acres' ? 35000 : 86500;
        setCrops([...crops, { id: Date.now().toString(), type: 'Paddy', scaleOfFinance: defaultScale, area: defaultArea }]);
    };

    const removeCrop = (id: string) => {
        setCrops(crops.filter(c => c.id !== id));
    };

    const updateCrop = (id: string, field: keyof Crop, value: string | number) => {
        setCrops(crops.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const addTermLoan = () => {
        setTermLoans([...termLoans, { id: Date.now().toString(), year: 1, description: '', amount: 0 }]);
    };

    const removeTermLoan = (id: string) => {
        setTermLoans(termLoans.filter(t => t.id !== id));
    };

    const updateTermLoan = (id: string, field: keyof TermLoan, value: string | number) => {
        setTermLoans(termLoans.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const reset = () => {
        setLandUnit('Acres');
        setFarmerType('Owner Cultivator');
        setIsMultiCrop(false);
        setSingleLandHolding('5');
        setSingleCropType('Paddy');
        setSingleScale('35000');
        setCrops([{ id: '1', type: 'Paddy', scaleOfFinance: 35000, area: 2 }]);
        setTermLoans([]);
        setPostHarvestPercent('10');
        setMaintenancePercent('20');
        setEscalationPercent('10');
        setInsurancePremium('0');
    };

    const downloadPDF = () => {
        const f = formatPdfCurrency;
        exportToPDF({
            title: "KCC Detailed Assessment",
            subtitle: `Sanction Report - ${farmerType} (${farmerCategory} Farmer)`,
            details: [
                { label: "Total Land Holding", value: `${(landUnit === 'Acres' ? totalAcres : totalHectares).toFixed(2)} ${landUnit}` },
                { label: "Cropping Pattern", value: isMultiCrop ? "Multi-Crop" : singleCropType },
                { label: "--- Base Calculation (Year 1) ---", value: "" },
                { label: "Base Cultivation Cost", value: f(year1Components.base) },
                { label: `Post Harvest (${postHarvestPercent}%)`, value: f(year1Components.ph) },
                { label: `Maintenance (${maintenancePercent}%)`, value: f(year1Components.maint) },
                { label: "Insurance Premium", value: f(year1Components.ins) },
                { label: "Year 1 Short Term Limit", value: f(projections[0].shortTermLimit) },
                { label: "--- Final Sanction ---", value: "" },
                { label: "Max Permissible Limit (MPL)", value: f(maxPermissibleLimit) },
                { label: "Amount in Words", value: limitWords }
            ]
        }, `KCC_Advanced_Assessment.pdf`, (doc: any, yPos: number) => {
            // Addition of generic table for 5-year projection
            yPos += 10;
            const columns = ["Year", "KCC Limit", "Term Loan", "Total"];
            const rows = projections.map(p => [
                `Year ${p.year}`,
                f(p.shortTermLimit),
                p.termLoan > 0 ? f(p.termLoan) : "-",
                f(p.totalDrawable)
            ]);
            return renderTable(doc, columns, rows, yPos);
        });
    };

    return (
        <Card className="premium-card w-full max-w-5xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600/10 via-background to-background border-b border-border/10 p-4 md:px-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Tractor className="w-6 h-6 text-green-700" />
                        <div>
                            <CardTitle className="text-xl font-black text-green-800">KCC Advanced</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-primary/80 dark:text-foreground/70">
                                5-Year Limit Assessment • {farmerCategory} Farmer
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={reset}
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border border-border/50 bg-card/60 hover:bg-accent/50 text-sm font-semibold flex items-center gap-2 transition"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </Button>
                        <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-green-600/30 hover:bg-green-600/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <FileDown className="w-5 h-5 text-green-700" />
                            EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 xl:grid-cols-12 overflow-hidden">
                    {/* INPUT SECTION */}
                    <div className="xl:col-span-7 p-4 md:p-6 space-y-6 border-r border-border/50 h-full overflow-y-auto max-h-[800px]">

                        {/* Top Controls */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1 share-row" data-share-key="landUnit" data-share-type="option">
                                <Label className="text-xs font-bold text-muted-foreground share-label">Land Unit</Label>
                                <div className="flex p-1 bg-accent/50 dark:bg-slate-800/50 rounded-lg shadow-inner">
                                    {['Acres', 'Hectares'].map(u => (
                                        <button
                                            key={u}
                                            onClick={() => handleUnitChange(u as 'Acres' | 'Hectares')}
                                            className={`flex-1 text-[11px] py-1.5 rounded-md font-black uppercase tracking-wider transition-all ${landUnit === u ? 'bg-white shadow dark:bg-slate-700 text-green-700 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1 col-span-2 md:col-span-1 share-row" data-share-key="farmerType" data-share-type="option">
                                <Label className="text-xs font-bold text-muted-foreground share-label">Farmer Type</Label>
                                <select
                                    value={farmerType}
                                    onChange={(e) => setFarmerType(e.target.value)}
                                    className="w-full h-9 text-xs font-bold bg-accent/30 border-none rounded-md px-2"
                                >
                                    <option>Owner Cultivator</option>
                                    <option>Tenant Farmer</option>
                                    <option>Share Cropper</option>
                                    <option>Self Help Group (SHG)</option>
                                </select>
                            </div>
                            <div className="space-y-1 share-row" data-share-key="inputMode" data-share-type="option">
                                <Label className="text-xs font-bold text-muted-foreground share-label">Mode</Label>
                                <div className="flex p-1 bg-accent/50 dark:bg-slate-800/50 rounded-lg shadow-inner">
                                    <button
                                        onClick={() => setIsMultiCrop(false)}
                                        className={`flex-1 text-[11px] py-1.5 rounded-md font-black uppercase tracking-wider transition-all ${!isMultiCrop ? 'bg-white shadow dark:bg-slate-700 text-green-700 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Single
                                    </button>
                                    <button
                                        onClick={() => setIsMultiCrop(true)}
                                        className={`flex-1 text-[11px] py-1.5 rounded-md font-black uppercase tracking-wider transition-all ${isMultiCrop ? 'bg-white shadow dark:bg-slate-700 text-green-700 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Multi
                                    </button>
                                </div>
                            </div>
                        </div>

                        {farmerType !== 'Owner Cultivator' && (
                            <div className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" /> Requires Consent Letter / Lease Agreement / Joint Liability Certificate.
                            </div>
                        )}

                        {/* Crop Inputs */}
                        {!isMultiCrop ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-100/50 dark:bg-slate-900/40 rounded-2xl border border-border/50">
                                <div className="space-y-1 share-row" data-share-key="landHolding" data-share-type="input">
                                    <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground share-label">Land Holding ({landUnit})</Label>
                                    <Input
                                        type="number"
                                        value={singleLandHolding}
                                        onChange={(e) => setSingleLandHolding(e.target.value)}
                                        className="h-12 text-xl font-black bg-accent/50 dark:bg-slate-800/50 border-none px-4 share-value"
                                    />
                                </div>
                                <div className="space-y-1 share-row" data-share-key="cropType" data-share-type="input">
                                    <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground share-label">Crop</Label>
                                    <select
                                        value={singleCropType}
                                        onChange={(e) => setSingleCropType(e.target.value)}
                                        className="w-full h-12 text-xl font-black bg-accent/50 dark:bg-slate-800/50 border-none rounded-md px-4 share-value"
                                    >
                                        {CROP_OPTIONS.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1 md:col-span-2 share-row" data-share-key="scaleOfFinance" data-share-type="input">
                                    <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground share-label">Scale of Finance (₹/{landUnit})</Label>
                                    <Input
                                        type="number"
                                        value={singleScale}
                                        onChange={(e) => setSingleScale(e.target.value)}
                                        className="h-12 text-xl font-black bg-accent/50 dark:bg-slate-800/50 border-none px-4 share-value"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold text-green-800">Crop Details</Label>
                                    <Button onClick={addCrop} size="sm" variant="ghost" className="h-6 text-xs text-green-700 hover:bg-green-50"><Plus className="w-3 h-3 mr-1" /> Add Crop</Button>
                                </div>
                                {crops.map((crop) => (
                                    <div key={crop.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-slate-100/50 dark:bg-slate-900/40 rounded-lg border border-slate-200/50 dark:border-white/5 share-row">
                                        <div className="col-span-4 space-y-1">
                                            <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground share-label">Type</Label>
                                            <select
                                                value={crop.type}
                                                onChange={(e) => updateCrop(crop.id, 'type', e.target.value)}
                                                className="w-full h-9 text-xs font-black bg-accent/50 dark:bg-slate-800/50 text-foreground rounded border-none px-2 share-value"
                                            >
                                                {CROP_OPTIONS.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3 space-y-1">
                                            <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground share-label">Area ({landUnit})</Label>
                                            <Input
                                                type="number"
                                                value={crop.area}
                                                onChange={(e) => updateCrop(crop.id, 'area', parseFloat(e.target.value))}
                                                className="h-9 text-xs font-black bg-accent/50 dark:bg-slate-800/50 text-foreground border-none px-2 share-value"
                                            />
                                        </div>
                                        <div className="col-span-4 space-y-1">
                                            <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground share-label">Scale (₹/{landUnit})</Label>
                                            <Input
                                                type="number"
                                                value={crop.scaleOfFinance}
                                                onChange={(e) => updateCrop(crop.id, 'scaleOfFinance', parseFloat(e.target.value))}
                                                className="h-9 text-xs font-black bg-accent/50 dark:bg-slate-800/50 text-foreground border-none px-2 share-value"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-center pb-1">
                                            <Button onClick={() => removeCrop(crop.id)} size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:bg-red-500/10">
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Parameters Toggle */}
                        <div className="border border-border/50 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setShowParams(!showParams)}
                                className="w-full flex justify-between items-center p-4 bg-muted/40 hover:bg-muted/60 transition-colors"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground dark:text-muted-foreground flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5" /> Assessment Parameters
                                </span>
                                {showParams ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {showParams && (
                                <div className="p-5 grid grid-cols-2 gap-4 bg-muted/10 animate-in slide-in-from-top-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground">Post Harvest (%)</Label>
                                        <Input type="number" value={postHarvestPercent} onChange={(e) => setPostHarvestPercent(e.target.value)} className="h-10 text-lg font-black bg-accent/30 dark:bg-slate-800/30 border-none px-3" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground">Maintenance (%)</Label>
                                        <Input type="number" value={maintenancePercent} onChange={(e) => setMaintenancePercent(e.target.value)} className="h-10 text-lg font-black bg-accent/30 dark:bg-slate-800/30 border-none px-3" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground">Escalation (%)</Label>
                                        <Input type="number" value={escalationPercent} onChange={(e) => setEscalationPercent(e.target.value)} className="h-10 text-lg font-black bg-accent/30 dark:bg-slate-800/30 border-none px-3" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-foreground dark:text-muted-foreground">Total Insurance (₹)</Label>
                                        <Input type="number" value={insurancePremium} onChange={(e) => setInsurancePremium(e.target.value)} className="h-10 text-lg font-black bg-accent/30 dark:bg-slate-800/30 border-none px-3" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Term Loans */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Term Loans for Investment</Label>
                                <Button onClick={addTermLoan} size="sm" variant="ghost" className="h-6 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Plus className="w-3 h-3 mr-1" /> Add Loan</Button>
                            </div>
                            {termLoans.length === 0 && (
                                <div className="text-[10px] text-muted-foreground text-center py-2 border border-dashed rounded-lg opacity-60">
                                    No term loans added. Click add to include farm assets.
                                </div>
                            )}
                            {termLoans.map((loan) => (
                                <div key={loan.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-100/50 dark:bg-slate-900/40 rounded-lg border border-slate-200/50 dark:border-white/5 share-row">
                                    <div className="col-span-2">
                                        <Label className="sr-only share-label">Year</Label>
                                        <select
                                            value={loan.year}
                                            onChange={(e) => updateTermLoan(loan.id, 'year', parseInt(e.target.value))}
                                            className="w-full h-8 text-xs font-black bg-accent/50 dark:bg-slate-800/50 text-foreground rounded border-none px-2 share-value"
                                        >
                                            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y} className="bg-background">Yr {y}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-6">
                                        <Label className="sr-only share-label">Investment Description</Label>
                                        <Input
                                            placeholder="Purpose (e.g. Pump set)"
                                            value={loan.description}
                                            onChange={(e) => updateTermLoan(loan.id, 'description', e.target.value)}
                                            className="h-8 text-xs font-black bg-accent/50 dark:bg-slate-800/50 text-foreground border-none px-2 share-value"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Label className="sr-only share-label">Investment Amount</Label>
                                        <Input
                                            type="number"
                                            placeholder="Amount"
                                            value={loan.amount}
                                            onChange={(e) => updateTermLoan(loan.id, 'amount', parseFloat(e.target.value))}
                                            className="h-8 text-xs font-black bg-accent/50 dark:bg-slate-800/50 text-foreground border-none px-2 text-right share-value"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <Button onClick={() => removeTermLoan(loan.id)} size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:bg-red-500/10">
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* RESULTS SECTION */}
                    <div className="xl:col-span-5 bg-muted/30 flex flex-col h-full">
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                            {/* Header Summary */}
                            <div className="space-y-1 share-row" data-share-key="year1Limit" data-share-type="result">
                                <span className="result-label share-label">Assessment Limit (Year 1)</span>
                                <div className="hero-result-value text-green-700 dark:text-emerald-500 leading-tight share-value">
                                    {formatIndianCurrency(year1Limit)}
                                </div>
                                <div className="flex gap-2 text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-tighter">
                                    <span>Base: {formatIndianCurrency(baseCultivationCost)}</span>
                                    <span>•</span>
                                    <span>Expenses: {formatIndianCurrency(postHarvestAmt + maintenanceAmt + insPremium)}</span>
                                </div>
                            </div>

                            {/* 5 Year Table */}
                            <div className="rounded-xl border border-border/50 overflow-hidden bg-background shadow-sm">
                                <div className="bg-muted p-2.5 grid grid-cols-4 text-[9px] font-black uppercase text-foreground dark:text-muted-foreground tracking-widest border-b border-border/50">
                                    <div>Year</div>
                                    <div className="text-right">KCC Limit</div>
                                    <div className="text-right">Term Loan</div>
                                    <div className="text-right">Total</div>
                                </div>
                                {projections.map((p, i) => (
                                    <div key={p.year} className={`grid grid-cols-4 p-2.5 text-xs border-b border-dashed border-border/30 last:border-0 ${i === 4 ? 'bg-green-500/5 font-black text-green-700 dark:text-emerald-500' : 'text-foreground/80'}`}>
                                        <div className="font-black">Year {p.year}</div>
                                        <div className="text-right font-bold">{formatIndianCurrency(p.shortTermLimit)}</div>
                                        <div className="text-right opacity-60">{p.termLoan > 0 ? formatIndianCurrency(p.termLoan) : '-'}</div>
                                        <div className="text-right font-black">{formatIndianCurrency(p.totalDrawable)}</div>
                                    </div>
                                ))}
                            </div>

                            {/* MPL Section */}
                            <div className="bg-slate-900 rounded-xl p-5 text-white space-y-3 share-row" data-share-key="mpl" data-share-type="result">
                                <div className="space-y-1 text-center">
                                    <div className="text-[10px] font-bold uppercase opacity-60 share-label">Final Sanction (MPL)</div>
                                    <div className="text-3xl font-black tracking-tight text-emerald-400 share-value">
                                        {formatIndianCurrency(maxPermissibleLimit)}
                                    </div>
                                </div>
                                <div className="h-px bg-white/10 w-full" />
                                <p className="text-[10px] text-center opacity-80 leading-relaxed font-medium">
                                    {limitWords}
                                </p>
                            </div>

                            {/* Logic Notes */}
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
                                    <span className="font-black block text-green-700 dark:text-emerald-500 uppercase tracking-tighter mb-1">Cost Escalation</span>
                                    <span className="font-bold text-muted-foreground">{escalationPercent}% cumulative increase from Year 2.</span>
                                </div>
                                <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
                                    <span className="font-black block text-green-700 dark:text-emerald-500 uppercase tracking-tighter mb-1">Scale of Finance</span>
                                    <span className="font-bold text-muted-foreground">Based on {isMultiCrop ? 'multiple crops' : singleCropType} selection.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card >
    );
};
