import type { CandidateJobsQuery } from "./candidate-jobs-api";

export const JOB_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
] as const;
export const LOCATION_TYPES = ["remote", "hybrid", "onsite"] as const;
export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

const JOB_QUERY_PARAMS = [
  "q",
  "companyId",
  "location",
  "jobType",
  "locationType",
  "experienceLevel",
  "minSalary",
  "maxSalary",
  "skills",
  "sortBy",
  "sortOrder",
  "page",
  "limit",
] as const;

export interface CandidateJobsQueryIssue {
  parameter: string;
  message: string;
}

export interface ParsedCandidateJobsQuery {
  query: CandidateJobsQuery;
  issues: CandidateJobsQueryIssue[];
}

export type CandidateJobsViewState =
  "invalid-query" | "loading" | "updating" | "error" | "empty" | "results";

export type CandidateJobsEmptyState = "no-jobs" | "no-matches" | "out-of-range";

function parseInteger(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export function parseJobQuery(
  params: URLSearchParams,
): ParsedCandidateJobsQuery {
  const issues: CandidateJobsQueryIssue[] = [];

  const read = (parameter: string): string | undefined => {
    const values = params.getAll(parameter);
    if (values.length > 1) {
      issues.push({
        parameter,
        message: "This parameter must only appear once.",
      });
      return undefined;
    }
    return values[0];
  };

  const invalid = (parameter: string, message: string) => {
    issues.push({ parameter, message });
  };

  const pageValue = read("page");
  const pageNumber = parseInteger(pageValue);
  let page = 1;
  if (pageValue !== undefined) {
    if (pageNumber === undefined || pageNumber < 1) {
      invalid(
        "page",
        "Page must be a whole number greater than or equal to 1.",
      );
    } else {
      page = pageNumber;
    }
  }

  const limitValue = read("limit");
  const limitNumber = parseInteger(limitValue);
  let limit = DEFAULT_PAGE_SIZE;
  if (limitValue !== undefined) {
    if (limitNumber === undefined || limitNumber < 1 || limitNumber > 100) {
      invalid(
        "limit",
        "Results per page must be a whole number from 1 to 100.",
      );
    } else {
      limit = limitNumber;
    }
  }

  const companyValue = read("companyId");
  const companyNumber = parseInteger(companyValue);
  let companyId: string | undefined;
  if (companyValue !== undefined) {
    if (companyNumber === undefined || companyNumber < 1) {
      invalid("companyId", "Company ID must be a positive whole number.");
    } else {
      companyId = String(companyNumber);
    }
  }

  const searchValue = read("q");
  const search = searchValue?.trim() ?? "";
  if (search.length > 200) {
    invalid("q", "Search text must be 200 characters or fewer.");
  }

  const locationValue = read("location");
  const location = locationValue?.trim() ?? "";
  if (location.length > 255) {
    invalid("location", "Location must be 255 characters or fewer.");
  }

  const jobTypeValue = read("jobType");
  let jobType: CandidateJobsQuery["jobType"] = "";
  if (jobTypeValue !== undefined) {
    if (JOB_TYPES.includes(jobTypeValue as (typeof JOB_TYPES)[number])) {
      jobType = jobTypeValue as CandidateJobsQuery["jobType"];
    } else {
      invalid("jobType", "Choose a supported job type.");
    }
  }

  const locationTypeValue = read("locationType");
  let locationType: CandidateJobsQuery["locationType"] = "";
  if (locationTypeValue !== undefined) {
    if (
      LOCATION_TYPES.includes(
        locationTypeValue as (typeof LOCATION_TYPES)[number],
      )
    ) {
      locationType = locationTypeValue as CandidateJobsQuery["locationType"];
    } else {
      invalid("locationType", "Choose remote, hybrid, or onsite.");
    }
  }

  const experienceValue = read("experienceLevel");
  const experienceLevel = experienceValue?.trim() ?? "";
  if (
    experienceValue !== undefined &&
    (experienceLevel.length === 0 || experienceLevel.length > 100)
  ) {
    invalid(
      "experienceLevel",
      "Experience level must be between 1 and 100 characters.",
    );
  }

  const minSalaryValue = read("minSalary");
  const parsedMinSalary = parseInteger(
    minSalaryValue === "" ? "0" : minSalaryValue,
  );
  let minSalary: string | undefined;
  if (minSalaryValue !== undefined) {
    if (parsedMinSalary === undefined || parsedMinSalary < 0) {
      invalid(
        "minSalary",
        "Minimum salary must be a non-negative whole number.",
      );
    } else {
      minSalary = String(parsedMinSalary);
    }
  }

  const maxSalaryValue = read("maxSalary");
  const parsedMaxSalary = parseInteger(
    maxSalaryValue === "" ? "0" : maxSalaryValue,
  );
  let maxSalary: string | undefined;
  if (maxSalaryValue !== undefined) {
    if (parsedMaxSalary === undefined || parsedMaxSalary < 0) {
      invalid(
        "maxSalary",
        "Maximum salary must be a non-negative whole number.",
      );
    } else {
      maxSalary = String(parsedMaxSalary);
    }
  }
  if (
    minSalary !== undefined &&
    maxSalary !== undefined &&
    Number(minSalary) > Number(maxSalary)
  ) {
    invalid(
      "maxSalary",
      "Maximum salary must be greater than or equal to minimum salary.",
    );
    maxSalary = undefined;
  }

  const skillsValue = read("skills");
  const skillsList =
    skillsValue
      ?.split(",")
      .map((skill) => skill.trim())
      .filter(Boolean) ?? [];
  let skills = "";
  if (skillsValue !== undefined) {
    if (skillsList.length === 0 || skillsList.length > 20) {
      invalid(
        "skills",
        "Skills must contain between 1 and 20 non-empty values.",
      );
    } else {
      skills = skillsList.join(",");
    }
  }

  const sortByValue = read("sortBy");
  let sortBy: CandidateJobsQuery["sortBy"] = "postedAt";
  if (sortByValue !== undefined) {
    if (sortByValue === "postedAt" || sortByValue === "salary") {
      sortBy = sortByValue;
    } else {
      invalid("sortBy", "Sort by posted date or salary.");
    }
  }

  const sortOrderValue = read("sortOrder");
  let sortOrder: CandidateJobsQuery["sortOrder"] = "desc";
  if (sortOrderValue !== undefined) {
    if (sortOrderValue === "asc" || sortOrderValue === "desc") {
      sortOrder = sortOrderValue;
    } else {
      invalid("sortOrder", "Sort order must be ascending or descending.");
    }
  }

  return {
    query: {
      page,
      limit,
      companyId,
      search: search.length <= 200 ? search : "",
      location: location.length <= 255 ? location : "",
      jobType,
      locationType,
      experienceLevel:
        experienceValue !== undefined &&
        experienceLevel.length > 0 &&
        experienceLevel.length <= 100
          ? experienceLevel
          : "",
      minSalary,
      maxSalary,
      skills,
      sortBy,
      sortOrder,
    },
    issues,
  };
}

export function serializeJobQuery(
  params: URLSearchParams,
  query: CandidateJobsQuery,
): URLSearchParams {
  for (const key of JOB_QUERY_PARAMS) params.delete(key);

  if (query.search?.trim()) params.set("q", query.search.trim());
  if (query.companyId) params.set("companyId", query.companyId);
  if (query.location?.trim()) params.set("location", query.location.trim());
  if (query.jobType) params.set("jobType", query.jobType);
  if (query.locationType) params.set("locationType", query.locationType);
  if (query.experienceLevel)
    params.set("experienceLevel", query.experienceLevel);
  if (query.minSalary) params.set("minSalary", query.minSalary);
  if (query.maxSalary) params.set("maxSalary", query.maxSalary);
  if (query.skills?.trim()) {
    params.set(
      "skills",
      query.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .join(","),
    );
  }
  if (query.sortBy !== "postedAt") params.set("sortBy", query.sortBy);
  if (query.sortOrder !== "desc") params.set("sortOrder", query.sortOrder);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.limit !== DEFAULT_PAGE_SIZE)
    params.set("limit", String(query.limit));
  return params;
}

export function getCandidateJobsViewState(input: {
  hasInvalidQuery: boolean;
  isPending: boolean;
  isError: boolean;
  hasData: boolean;
  isPlaceholderData: boolean;
  jobCount: number;
}): CandidateJobsViewState {
  if (input.hasInvalidQuery) return "invalid-query";
  if (input.isError && (!input.hasData || input.isPlaceholderData))
    return "error";
  if (input.hasData && input.isPlaceholderData) return "updating";
  if (input.isPending || !input.hasData) return "loading";
  return input.jobCount === 0 ? "empty" : "results";
}

export function getCandidateJobsEmptyState(
  hasFilters: boolean,
  total: number,
): CandidateJobsEmptyState {
  if (total > 0) return "out-of-range";
  return hasFilters ? "no-matches" : "no-jobs";
}
