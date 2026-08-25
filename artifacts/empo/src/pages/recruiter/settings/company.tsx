import { useMemo, useState } from 'react';
import { Building2, Globe, Save, Check } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/design-system/card';
import { Button } from '@workspace/design-system/button';
import { Input } from '@workspace/design-system/input';
import { Label } from '@workspace/design-system/label';
import { Textarea } from '@workspace/design-system/textarea';
import { Badge } from '@workspace/design-system/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/design-system/select';
import { toast } from '@workspace/design-system/hooks/use-toast';

const INDUSTRIES = ['Financial Services', 'Technology', 'Healthcare', 'Education', 'Retail', 'Manufacturing'];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export default function CompanySettings() {
  const [form, setForm] = useState({
    name: 'Stratos Financial', industry: 'Financial Services', size: '201-500',
    website: 'https://stratos.com', location: 'San Francisco, CA',
    description: 'Stratos Financial is a leading fintech company building the next generation of financial infrastructure for businesses of all sizes.',
    culture: 'We believe in radical transparency, continuous learning, and shipping fast.',
    benefits: ['Health, Dental & Vision', '401(k) with 4% match', 'Flexible PTO', '$3k Learning Budget', 'Hybrid Work', 'Equity Package'],
  });
  const [newBenefit, setNewBenefit] = useState('');
  const [saved, setSaved] = useState(false);

  const requiredFields = [form.name, form.industry, form.size, form.website, form.location, form.description];
  const completion = useMemo(
    () => Math.round((requiredFields.filter(Boolean).length / requiredFields.length) * 100),
    [form.name, form.industry, form.size, form.website, form.location, form.description]
  );

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function addBenefit() {
    const v = newBenefit.trim();
    if (!v) return;
    updateField('benefits', [...form.benefits, v]);
    setNewBenefit('');
  }

  function handleSave() {
    setSaved(true);
    toast({ title: 'Company profile saved', description: 'Your changes are now visible to candidates.' });
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Company Information"
        eyebrow={`${completion}% PROFILE COMPLETE · ${form.size} EMPLOYEES`}
        description="Manage your company profile visible to candidates."
        actions={
          <Button data-testid="btn-save" onClick={handleSave} className={saved ? 'bg-success text-success-foreground hover:bg-success/90' : 'shadow-sm'}>
            {saved ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        }
      />

      <div className="space-y-5">
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-surface-subtle/50 border-b border-border py-4 flex-row items-center gap-2 space-y-0">
            <Building2 className="w-[18px] h-[18px] text-primary" />
            <CardTitle className="text-base font-display font-semibold">Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="input-name">Company Name</Label>
              <Input id="input-name" data-testid="input-name" value={form.name} onChange={e => updateField('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={v => updateField('industry', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Company Size</Label>
              <Select value={form.size} onValueChange={v => updateField('size', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="input-website">Website</Label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="input-website" data-testid="input-website" className="pl-9" value={form.website} onChange={e => updateField('website', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="input-location">Headquarters</Label>
              <Input id="input-location" data-testid="input-location" value={form.location} onChange={e => updateField('location', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="input-description">Description</Label>
              <Textarea id="input-description" rows={3} value={form.description} onChange={e => updateField('description', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="input-culture">Culture & Values</Label>
              <Textarea id="input-culture" rows={2} value={form.culture} onChange={e => updateField('culture', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="bg-surface-subtle/50 border-b border-border py-4">
            <CardTitle className="text-base font-display font-semibold">Benefits & Perks</CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-wrap gap-2">
            {form.benefits.map(b => (
              <Badge key={b} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium">
                {b}
                <button
                  type="button"
                  onClick={() => updateField('benefits', form.benefits.filter(x => x !== b))}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${b}`}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Input
              placeholder="Add benefit…"
              value={newBenefit}
              onChange={e => setNewBenefit(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBenefit(); } }}
              className="h-8 rounded-full border-dashed text-sm min-w-32 w-auto flex-1 max-w-48"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
