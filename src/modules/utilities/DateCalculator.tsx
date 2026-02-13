import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { CalendarDays, Clock, ArrowRightLeft, History, FileDown, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf-export';
import { addDays, addMonths, addYears, format, differenceInDays, parseISO, isValid } from 'date-fns';
import { cn } from '../../lib/utils';

export const DateCalculator: React.FC = () => {
    const [mode, setMode] = useLocalStorage<string>('date_mode', 'maturity'); // maturity, diff

    // Maturity Inputs
    const [startDate, setStartDate] = useLocalStorage<string>('date_start', new Date().toISOString().split('T')[0]);
    const [tenure, setTenure] = useLocalStorage<string>('date_tenure', '12');
    const [tenureType, setTenureType] = useLocalStorage<string>('date_tenure_type', 'months'); // days, months, years
    const [maturityDate, setMaturityDate] = useState<string>('');

    // Diff Inputs
    const [endDate, setEndDate] = useLocalStorage<string>('date_end', new Date().toISOString().split('T')[0]);
    const [diffDays, setDiffDays] = useState<number>(0);

    const handleReset = () => {
        setMode('maturity');
        setStartDate(new Date().toISOString().split('T')[0]);
        setTenure('12');
        setTenureType('months');
        setEndDate(new Date().toISOString().split('T')[0]);
    };

    const calculate = React.useCallback(() => {
        if (mode === 'maturity') {
            const start = parseISO(startDate);
            const t = parseInt(tenure);

            if (!isValid(start) || isNaN(t)) {
                setMaturityDate('Invalid Date');
                return;
            }

            let resultDate = start;
            if (tenureType === 'days') resultDate = addDays(start, t);
            else if (tenureType === 'months') resultDate = addMonths(start, t);
            else if (tenureType === 'years') resultDate = addYears(start, t);

            setMaturityDate(format(resultDate, 'dd-MMM-yyyy (EEEE)'));
        } else {
            const start = parseISO(startDate);
            const end = parseISO(endDate);

            if (!isValid(start) || !isValid(end)) {
                setDiffDays(0);
                return;
            }

            const diff = differenceInDays(end, start);
            setDiffDays(diff);
        }
    }, [mode, startDate, tenure, tenureType, endDate]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    const downloadPDF = () => {
        exportToPDF({
            title: "Date Dynamics Analysis",
            subtitle: `${mode === 'maturity' ? "Maturity Forecasting Engine" : "Duration Multi-Matrix Analysis"} | Operational Protocol`,
            details: [
                { label: "Reference Start Date", value: format(parseISO(startDate), 'dd-MMM-yyyy') },
                ...(mode === 'maturity' ? [
                    { label: "Configured Tenure", value: `${tenure} ${tenureType}` },
                    { label: "--- Forecasted Result ---", value: "" },
                    { label: "Maturity Date", value: maturityDate }
                ] : [
                    { label: "Target Terminal Date", value: format(parseISO(endDate), 'dd-MMM-yyyy') },
                    { label: "--- Duration Metrics ---", value: "" },
                    { label: "Total Elapsed Days", value: `${diffDays} Days` },
                    { label: "Equivalent Weeks", value: `${(diffDays / 7).toFixed(1)} Weeks` }
                ])
            ]
        }, `Date_Analysis_Report.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 via-background to-background border-b border-border/10 pb-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-black flex items-center gap-2">
                            <CalendarDays className="w-8 h-8 text-blue-600" />
                            Date Engine
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                            Tenure Analysis & Maturity Forecasting
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border border-border/50 bg-card/60 hover:bg-accent/50 text-sm font-semibold flex items-center gap-2 transition"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </Button>
                        <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <FileDown className="w-5 h-5 text-primary" />
                            EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue={mode} value={mode} onValueChange={setMode} className="w-full">
                    <div className="p-4 bg-muted/30 border-b border-border/50">
                        <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent h-auto p-0">
                            {[
                                { id: 'maturity', label: 'Maturity Forecast', icon: <Clock className="w-4 h-4" /> },
                                { id: 'diff', label: 'Duration Analysis', icon: <ArrowRightLeft className="w-4 h-4" /> }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black uppercase tracking-widest text-[11px] shadow-sm",
                                        "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20",
                                        "hover:bg-accent/80 text-foreground opacity-60 data-[state=active]:opacity-100 hover:opacity-100"
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
                        {/* Inputs Section */}
                        <div className="lg:col-span-7 p-6 md:p-8 space-y-8 border-r border-border/50">
                            {mode === 'maturity' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="space-y-1 share-row" data-share-key="startDate" data-share-type="input">
                                        <Label className="text-[10px] font-bold uppercase text-blue-700 opacity-70 share-label">Start Date</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="h-12 text-xl font-black bg-accent border-none focus-visible:ring-blue-500 px-6 share-value"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1 share-row" data-share-key="tenureValue" data-share-type="input">
                                            <Label className="text-[10px] font-bold uppercase text-blue-700 opacity-70 share-label">Tenure</Label>
                                            <Input
                                                type="number"
                                                value={tenure}
                                                onChange={(e) => setTenure(e.target.value)}
                                                className="h-12 text-2xl font-black bg-accent border-none px-6 share-value"
                                            />
                                        </div>
                                        <div className="space-y-1 share-row" data-share-key="unit">
                                            <Label className="text-[10px] font-bold uppercase text-blue-700 opacity-70 share-label">Unit</Label>
                                            <div className="grid grid-cols-3 gap-1 p-1 bg-accent border-none rounded-xl h-12">
                                                {['days', 'months', 'years'].map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setTenureType(t)}
                                                        className={cn(
                                                            "py-1 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm border",
                                                            tenureType === t
                                                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 share-value"
                                                                : "bg-background border-transparent text-foreground hover:bg-accent opacity-60 hover:opacity-100"
                                                        )}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mode === 'diff' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="space-y-1 share-row" data-share-key="startDate" data-share-type="input">
                                        <Label className="text-[10px] font-bold uppercase text-blue-700 opacity-70 share-label">Reference Start Date</Label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="h-12 text-xl font-black bg-accent border-none focus-visible:ring-blue-500 px-6 share-value"
                                        />
                                    </div>
                                    <div className="space-y-1 share-row" data-share-key="endDate" data-share-type="input">
                                        <Label className="text-[10px] font-bold uppercase text-blue-700 opacity-70 share-label">Target End Date</Label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="h-12 text-xl font-black bg-accent border-none focus-visible:ring-blue-500 px-6 share-value"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Section */}
                        <div className="lg:col-span-5 p-6 md:p-8 bg-muted/40 flex flex-col justify-center">
                            <div className="space-y-8 text-center lg:text-left">
                                <div className="space-y-2 share-row" data-share-key="computedDate" data-share-type="result">
                                    <span className="result-label share-label">
                                        {mode === 'maturity' ? 'Forecasted Maturity' : 'Elapsed Duration'}
                                    </span>
                                    <div className="hero-result-value text-blue-600 leading-tight share-value">
                                        {mode === 'maturity' ? maturityDate : `${diffDays} Days`}
                                    </div>
                                </div>

                                <div className="stat-card bg-blue-500/10 border border-blue-500/20 shadow-sm p-4 rounded-xl">
                                    <div className="flex justify-between items-center mb-2.5">
                                        <span className="result-label text-blue-800">Timeline Impact</span>
                                        <History className="w-4.5 h-4.5 text-blue-600" />
                                    </div>
                                    <p className="text-[11px] font-black text-blue-900 leading-relaxed uppercase tracking-tighter indent-1 border-l-2 border-blue-500/30 pl-2">
                                        {mode === 'maturity'
                                            ? `Projected end point for a ${tenure} ${tenureType} term.`
                                            : `Total span between selected check-points.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};
