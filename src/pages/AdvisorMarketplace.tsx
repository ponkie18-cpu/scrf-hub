import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  Briefcase,
  Shield,
  Scale,
  TrendingUp,
  Globe,
  Clock,
  CheckCircle2,
  Users,
  ExternalLink,
  Mail,
} from 'lucide-react';

interface Advisor {
  id: string;
  name: string;
  title: string;
  firm: string;
  specialities: string[];
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  yearsExperience: number;
  responseTime: string;
  bio: string;
  avatar: string;
  category: 'accountant' | 'lawyer' | 'consultant' | 'cyber' | 'insurance';
}

const ADVISORS: Advisor[] = [
  {
    id: '1', name: 'Sarah Mitchell', title: 'Chartered Accountant', firm: 'Mitchell & Associates',
    specialities: ['Tax Planning', 'Cash Flow', 'SME Advisory'], location: 'London, UK',
    rating: 4.9, reviews: 127, verified: true, yearsExperience: 15, responseTime: '< 24h',
    bio: 'Specialising in SME financial resilience with 15 years of experience helping small businesses navigate compliance and growth challenges.',
    avatar: 'SM', category: 'accountant',
  },
  {
    id: '2', name: 'James Okafor', title: 'Commercial Solicitor', firm: 'Okafor Legal LLP',
    specialities: ['Contract Law', 'Data Protection', 'GDPR'], location: 'Manchester, UK',
    rating: 4.8, reviews: 89, verified: true, yearsExperience: 12, responseTime: '< 48h',
    bio: 'Experienced commercial solicitor focusing on data protection compliance and contract risk management for growing businesses.',
    avatar: 'JO', category: 'lawyer',
  },
  {
    id: '3', name: 'Priya Sharma', title: 'Risk Management Consultant', firm: 'Resilience Partners',
    specialities: ['Business Continuity', 'Operational Risk', 'ISO 22301'], location: 'Birmingham, UK',
    rating: 4.7, reviews: 64, verified: true, yearsExperience: 10, responseTime: '< 24h',
    bio: 'Certified business continuity professional helping SMEs build robust operational resilience frameworks.',
    avatar: 'PS', category: 'consultant',
  },
  {
    id: '4', name: 'David Chen', title: 'Cyber Security Advisor', firm: 'CyberShield UK',
    specialities: ['Cyber Essentials', 'Incident Response', 'Penetration Testing'], location: 'Edinburgh, UK',
    rating: 4.9, reviews: 103, verified: true, yearsExperience: 8, responseTime: '< 12h',
    bio: 'NCSC-certified cyber security professional specialising in affordable security solutions for SMEs and startups.',
    avatar: 'DC', category: 'cyber',
  },
  {
    id: '5', name: 'Emma Williams', title: 'Business Insurance Broker', firm: 'Shield Insurance Group',
    specialities: ['Professional Indemnity', 'Cyber Insurance', 'Business Interruption'], location: 'Cardiff, UK',
    rating: 4.6, reviews: 71, verified: true, yearsExperience: 11, responseTime: '< 24h',
    bio: 'Independent broker helping small businesses find the right insurance coverage to protect against operational and cyber risks.',
    avatar: 'EW', category: 'insurance',
  },
  {
    id: '6', name: 'Tom Baker', title: 'Fractional CFO', firm: 'Baker Advisory',
    specialities: ['Financial Strategy', 'Fundraising', 'Board Reporting'], location: 'Bristol, UK',
    rating: 4.8, reviews: 55, verified: true, yearsExperience: 18, responseTime: '< 48h',
    bio: 'Part-time CFO services for scaling SMEs. Expertise in financial forecasting, stress testing, and investor readiness.',
    avatar: 'TB', category: 'accountant',
  },
];

const CATEGORIES = [
  { value: 'all', label: 'All Advisors', icon: Users },
  { value: 'accountant', label: 'Accountants & CFOs', icon: TrendingUp },
  { value: 'lawyer', label: 'Legal Advisors', icon: Scale },
  { value: 'consultant', label: 'Risk Consultants', icon: Shield },
  { value: 'cyber', label: 'Cyber Security', icon: Globe },
  { value: 'insurance', label: 'Insurance', icon: Briefcase },
];

export default function AdvisorMarketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);

  const filtered = ADVISORS.filter((a) => {
    const matchesCategory = category === 'all' || a.category === category;
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
      || a.specialities.some((s) => s.toLowerCase().includes(search.toLowerCase()))
      || a.firm.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Advisor Marketplace</h1>
              <p className="text-muted-foreground mt-1">
                Connect with verified professionals who understand your SCRF results and can provide targeted guidance.
              </p>
            </div>
            <Badge variant="secondary" className="self-start md:self-auto gap-1 text-sm py-1.5 px-3">
              <CheckCircle2 className="h-3.5 w-3.5" /> {ADVISORS.length} Verified Advisors
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, speciality, or firm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.value}
                variant={category === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat.value)}
                className="gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" /> {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((advisor) => (
            <Card
              key={advisor.id}
              className="hover:shadow-md transition-shadow cursor-pointer border-border"
              onClick={() => setSelectedAdvisor(advisor)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {advisor.avatar}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      {advisor.name}
                      {advisor.verified && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </CardTitle>
                    <CardDescription className="text-xs">{advisor.title} • {advisor.firm}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {advisor.rating} ({advisor.reviews})
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {advisor.location}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {advisor.specialities.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {advisor.yearsExperience}y exp</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {advisor.responseTime}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No advisors match your search. Try broadening your filters.</p>
          </div>
        )}

        {/* How it works */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Complete an Assessment', desc: 'Run any SCRF tool to generate your risk profile and results.' },
            { step: '2', title: 'Share with an Advisor', desc: 'Use the "Get Advisor Feedback" button to send a branded summary.' },
            { step: '3', title: 'Get Expert Guidance', desc: 'Your advisor reviews your results and provides targeted recommendations.' },
          ].map((item) => (
            <Card key={item.step} className="text-center border-dashed">
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Advisor Detail Modal */}
      {selectedAdvisor && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedAdvisor(null)}>
          <Card className="max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {selectedAdvisor.avatar}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedAdvisor.name}
                    {selectedAdvisor.verified && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </CardTitle>
                  <CardDescription>{selectedAdvisor.title} • {selectedAdvisor.firm}</CardDescription>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> {selectedAdvisor.rating} ({selectedAdvisor.reviews} reviews)
                    </span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedAdvisor.location}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedAdvisor.bio}</p>

              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Specialities</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAdvisor.specialities.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-lg font-bold text-foreground">{selectedAdvisor.yearsExperience}</p>
                  <p className="text-xs text-muted-foreground">Years Experience</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-lg font-bold text-foreground">{selectedAdvisor.responseTime}</p>
                  <p className="text-xs text-muted-foreground">Response Time</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 gap-2">
                  <Mail className="h-4 w-4" /> Contact Advisor
                </Button>
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> Profile
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                💡 Use the "Get Advisor Feedback" button on any tool result to share your SCRF report directly.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
