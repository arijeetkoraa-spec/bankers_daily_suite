import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Scale, Maximize, Ruler, Weight, ArrowRightLeft, Sparkles, FileDown, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { exportToPDF } from '../../lib/pdf-export';
import { cn } from '../../lib/utils';

type UnitType = 'area' | 'length' | 'weight';

const factors: Record<UnitType, Record<string, number>> = {
    area: {
        'sqft': 1,
        'sqmt': 10.7639,
        'acre': 43560,
        'hectare': 107639,
        'sqyd': 9
    },
    length: {
        'meter': 3.28084,
        'feet': 1,
        'inch': 0.0833333,
        'cm': 0.0328084
    },
    weight: {
        'kg': 1,
        'lbs': 0.453592,
        'gm': 0.001,
        'ton': 1000
    }
};

const unitLabels: Record<string, string> = {
    'sqft': 'Sq. Feet', 'sqmt': 'Sq. Meter', 'acre': 'Acre', 'hectare': 'Hectare', 'sqyd': 'Sq. Yard',
    'meter': 'Meter', 'feet': 'Feet', 'inch': 'Inch', 'cm': 'Centimeter',
    'kg': 'Kilogram', 'lbs': 'Pounds', 'gm': 'Gram', 'ton': 'Metric Ton'
};

const unitIcons: Record<UnitType, React.ReactNode> = {
    area: <Maximize className="w-4 h-4" />,
    length: <Ruler className="w-4 h-4" />,
    weight: <Weight className="w-4 h-4" />
};

export const UnitConverter: React.FC = () => {
    const [type, setType] = useLocalStorage<UnitType>('unit_type', 'area');
    const [fromUnit, setFromUnit] = useLocalStorage<string>('unit_from', 'sqft');
    const [toUnit, setToUnit] = useLocalStorage<string>('unit_to', 'sqmt');
    const [value, setValue] = useLocalStorage<string>('unit_val', '1000');

    const handleReset = () => {
        setType('area');
        setFromUnit('sqft');
        setToUnit('sqmt');
        setValue('1000');
    };
    const [result, setResult] = useState<string>('');

    useEffect(() => {
        const availableParams = Object.keys(factors[type] || {});
        if (!availableParams.includes(fromUnit)) setFromUnit(availableParams[0]);
        if (!availableParams.includes(toUnit)) setToUnit(availableParams[1] || availableParams[0]);
    }, [type, setFromUnit, setToUnit, fromUnit, toUnit]);

    const calculate = React.useCallback(() => {
        const val = parseFloat(value);
        if (isNaN(val)) {
            setResult('0');
            return;
        }

        const currentFactors = factors[type];
        if (!currentFactors) return;

        const factorFrom = currentFactors[fromUnit];
        const factorTo = currentFactors[toUnit];

        if (!factorFrom || !factorTo) return;

        const valInBase = val * factorFrom;
        const valInTarget = valInBase / factorTo;

        setResult(valInTarget.toLocaleString('en-IN', { maximumFractionDigits: 4 }));

    }, [type, fromUnit, toUnit, value]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    const downloadPDF = () => {
        exportToPDF({
            title: "Unit Conversion Audit",
            subtitle: `${type.toUpperCase()} Conversion Matrix`,
            details: [
                { label: "Measurement Category", value: type.charAt(0).toUpperCase() + type.slice(1) },
                { label: "--- Input ---", value: "" },
                { label: "Source Value", value: value },
                { label: "Source Unit", value: unitLabels[fromUnit] },
                { label: "--- Output ---", value: "" },
                { label: "Target Value", value: result },
                { label: "Target Unit", value: unitLabels[toUnit] },
                { label: "--- Reference Identity ---", value: "" },
                { label: "Conversion Match", value: `${value} ${fromUnit} = ${result} ${toUnit}` }
            ]
        }, `Unit_Conversion_${type}.pdf`);
    };

    return (
        <Card className="premium-card w-full max-w-4xl mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-cyan-500/10 via-background to-background border-b border-border/10 pb-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-black flex items-center gap-2">
                            <Scale className="w-8 h-8 text-cyan-600" />
                            Unit Engine
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                            Multi-Dimensional Constant Conversion
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
                        <Button onClick={downloadPDF} variant="outline" size="sm" className="h-10 gap-2 border-cyan-500/30 hover:bg-cyan-500/10 hidden md:flex text-xs font-black px-4 shadow-sm">
                            <FileDown className="w-5 h-5 text-cyan-600" />
                            EXPORT PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue={type} value={type} onValueChange={(v) => setType(v as UnitType)} className="w-full">
                    <div className="p-4 bg-muted/30 border-b border-border/50 share-row">
                        <span className="sr-only share-label">Category</span>
                        <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent h-auto p-0">
                            {(['area', 'length', 'weight'] as UnitType[]).map((t) => (
                                <TabsTrigger
                                    key={t}
                                    value={t}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black uppercase tracking-widest text-[11px] shadow-sm",
                                        "data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20",
                                        "hover:bg-accent/80 text-foreground opacity-60 data-[state=active]:opacity-100 hover:opacity-100",
                                        type === t ? "share-value" : ""
                                    )}
                                >
                                    {unitIcons[t]}
                                    {t}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
                        {/* Inputs Section */}
                        <div className="lg:col-span-7 p-6 md:p-8 space-y-8 border-r border-border/50">
                            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                                <div className="md:col-span-5 space-y-1 share-row">
                                    <Label className="text-[10px] font-bold uppercase text-cyan-700 opacity-70 share-label">From ({unitLabels[fromUnit]})</Label>
                                    <div className="relative group">
                                        <Input
                                            type="number"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            className="h-12 text-2xl font-black bg-accent border-none focus-visible:ring-cyan-500 px-6 transition-all group-hover:bg-accent/80 share-value"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500 opacity-60">
                                            {unitIcons[type]}
                                        </div>
                                    </div>
                                    <select
                                        className="h-12 w-full rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                                        value={fromUnit}
                                        onChange={(e) => setFromUnit(e.target.value)}
                                    >
                                        {factors[type] && Object.keys(factors[type]).map(u => (
                                            <option key={u} value={u}>{unitLabels[u] || u}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-1 flex justify-center pt-6 opacity-40">
                                    <ArrowRightLeft className="w-6 h-6 rotate-90 md:rotate-0" />
                                </div>

                                <div className="md:col-span-5 space-y-1 share-row">
                                    <Label className="text-[10px] font-bold uppercase text-cyan-700 opacity-70 share-label">To ({unitLabels[toUnit]})</Label>
                                    <div className="h-12 flex items-center px-6 rounded-2xl bg-cyan-600/10 border border-cyan-600/20 text-xl font-black text-cyan-700 overflow-hidden text-ellipsis whitespace-nowrap shadow-inner share-value">
                                        {result}
                                    </div>
                                    <select
                                        className="h-12 w-full rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                                        value={toUnit}
                                        onChange={(e) => setToUnit(e.target.value)}
                                    >
                                        {factors[type] && Object.keys(factors[type]).map(u => (
                                            <option key={u} value={u}>{unitLabels[u] || u}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 text-[11px] font-black text-cyan-800 uppercase tracking-widest">
                                    <Sparkles className="w-4 h-4 text-cyan-600" /> Matrix Configuration
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-cyan-800 uppercase tracking-tighter">Base Reference</span>
                                        <span className="text-[11px] font-black text-foreground">{unitLabels[Object.keys(factors[type])[0]]}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-cyan-800 uppercase tracking-tighter">Precision</span>
                                        <span className="text-[11px] font-black text-foreground">4 Decimals</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-cyan-800 uppercase tracking-tighter">Calculation</span>
                                        <span className="text-[11px] font-black text-foreground">Relative</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Section */}
                        <div className="lg:col-span-5 p-6 md:p-8 bg-muted/40 flex flex-col justify-center">
                            <div className="space-y-10 text-center lg:text-left">
                                <div className="space-y-2">
                                    <span className="result-label">Converted Out-turn</span>
                                    <div className="hero-result-value text-cyan-700 leading-tight">
                                        {result}
                                    </div>
                                    <div className="text-sm font-black uppercase tracking-widest text-cyan-600/40">
                                        {unitLabels[toUnit]}
                                    </div>
                                </div>

                                <div className="stat-card bg-cyan-500/5 border-none group">
                                    <span className="result-label text-cyan-700">Conversion Identity</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-xl font-black text-foreground">{value}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{fromUnit}</span>
                                        <ArrowRightLeft className="w-3 h-3 mx-1 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-xl font-black text-cyan-600">{result}</span>
                                        <span className="text-[10px] font-bold text-cyan-400 uppercase">{toUnit}</span>
                                    </div>
                                </div>

                                <p className="text-[10px] text-foreground font-black text-center uppercase tracking-tighter italic bg-cyan-500/5 py-2 rounded-lg">
                                    *Conversion factors are based on standard SI and Imperial scientific constants. Results are rounded for operational convenience in commercial banking reports.
                                </p>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};
