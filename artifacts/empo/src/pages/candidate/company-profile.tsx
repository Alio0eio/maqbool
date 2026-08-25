import React from "react";
import { Link, useParams } from "wouter";
import { MOCK_JOBS } from "@/lib/mock-data";
import { Button } from "@workspace/design-system/button";
import { Badge } from "@workspace/design-system/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { Card, CardContent } from "@workspace/design-system/card";
import { JobCard } from "@/components/shared/job-card";
import { ArrowLeft, MapPin, Users, Globe, Building2 } from "lucide-react";
import NotFound from "@/pages/not-found";

const COMPANY_PROFILES: Record<string, {
  name: string;
  tagline: string;
  about: string;
  culture: string;
  size: string;
  founded: string;
  hq: string;
  website: string;
  logoUrl?: string;
  benefits: string[];
}> = {
  "stratos-financial": {
    name: "Stratos Financial",
    tagline: "Building the financial infrastructure of tomorrow",
    about: "Stratos Financial is a leading fintech company building the next generation of financial infrastructure for businesses of all sizes. We partner with banks, lenders, and enterprises to make moving and managing money simpler, safer, and faster.",
    culture: "We believe in radical transparency, continuous learning, and shipping fast. Our teams are small, autonomous, and empowered to own outcomes end to end.",
    size: "201-500 employees",
    founded: "2018",
    hq: "San Francisco, CA",
    website: "stratos.com",
    benefits: ["Health, Dental & Vision", "401(k) with 4% match", "Flexible PTO", "$3k Learning Budget", "Hybrid Work", "Equity Package"],
  },
};

export default function CompanyProfile() {
  const { slug } = useParams<{ slug: string }>();
  const company = COMPANY_PROFILES[slug ?? ""] ?? COMPANY_PROFILES["stratos-financial"];

  if (!company) return <NotFound />;

  const openRoles = MOCK_JOBS.filter(j => j.status === "published" && j.company === company.name);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <Link href="/candidate/jobs">
        <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>
      </Link>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/10 to-secondary/10 w-full" />
        <CardContent className="px-6 sm:px-10 pb-8 pt-0 relative">
          <div className="flex items-end gap-5 -mt-10 mb-6">
            <Avatar className="w-20 h-20 border-4 border-white shadow-md bg-white">
              <AvatarImage src={openRoles[0]?.companyLogoUrl || ""} alt={company.name} />
              <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                {company.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="mb-1">
              <p className="font-mono text-[11px] uppercase tracking-wider text-accent-record-ink mb-1">
                {company.size} · {openRoles.length} open role{openRoles.length === 1 ? "" : "s"}
              </p>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight leading-none mb-2">
                {company.name}
              </h1>
              <p className="text-muted-foreground">{company.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-y-4 gap-x-8 text-sm font-medium text-muted-foreground border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-foreground/70" />
              <span className="text-foreground">{company.hq}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-foreground/70" />
              <span className="text-foreground">{company.size}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-foreground/70" />
              <span className="text-foreground">Founded {company.founded}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-foreground/70" />
              <span className="text-foreground">{company.website}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed">{company.about}</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-4">Culture & Values</h2>
            <p className="text-muted-foreground leading-relaxed">{company.culture}</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-4">
              Open Roles <span className="font-mono">({openRoles.length})</span>
            </h2>
            {openRoles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {openRoles.map(job => (
                  <JobCard key={job.id} job={job} variant="candidate" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No open roles right now. Check back soon.</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm bg-surface-bg">
            <CardContent className="p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Benefits & Perks</h3>
              <ul className="space-y-3">
                {company.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
