import React from "react";
import { Link, useParams } from "wouter";
import { MOCK_JOBS } from "@/lib/mock-data";
import { Button } from "@workspace/design-system/button";
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

      <Card className="overflow-hidden">
        <CardContent className="px-6 sm:px-10 py-8">
          <div className="flex items-start gap-5 mb-6">
            <Avatar className="w-16 h-16 rounded-[12px] border border-border/70 shrink-0">
              <AvatarImage src={openRoles[0]?.companyLogoUrl || ""} alt={company.name} />
              <AvatarFallback className="rounded-[12px] bg-primary/[0.08] text-primary text-xl font-semibold">
                {company.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-muted-foreground mb-1.5">
                {company.size} · {openRoles.length} open role{openRoles.length === 1 ? "" : "s"}
              </p>
              <h1 className="text-[26px] font-semibold text-foreground tracking-[-0.02em] leading-[1.15] mb-2">
                {company.name}
              </h1>
              <p className="text-muted-foreground text-[14px]">{company.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-y-3 gap-x-8 text-[13.5px] font-medium text-muted-foreground border-t border-border/60 pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground">{company.hq}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground">{company.size}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground">Founded {company.founded}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground">{company.website}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">About</h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed">{company.about}</p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">Culture & Values</h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed">{company.culture}</p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">
              Open Roles ({openRoles.length})
            </h2>
            {openRoles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {openRoles.map(job => (
                  <JobCard key={job.id} job={job} variant="candidate" />
                ))}
              </div>
            ) : (
              <p className="text-[13.5px] text-muted-foreground">No open roles right now. Check back soon.</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-4">Benefits & Perks</h3>
              <ul className="space-y-3">
                {company.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13.5px] text-muted-foreground">
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
