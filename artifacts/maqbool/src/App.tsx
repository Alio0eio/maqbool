import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@workspace/design-system/toaster';
import { TooltipProvider } from '@workspace/design-system/tooltip';
import NotFound from '@/pages/not-found';
import { MotionConfig } from 'framer-motion';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';

import AuthPage from '@/pages/auth';
import { RecruiterShell } from '@/components/layout/recruiter-shell';
import { CandidateShell } from '@/components/layout/candidate-shell';
import { RequireAuth } from '@/components/layout/require-auth';
import { AuthProvider } from '@/lib/auth';
import { SplashScreen } from '@/components/shared/splash-screen';

const queryClient = new QueryClient();

import RecruiterDashboard from '@/pages/recruiter/dashboard';
import RecruiterJobs from '@/pages/recruiter/jobs';
import RecruiterCandidates from '@/pages/recruiter/candidates';

import CandidateDashboard from '@/pages/candidate/dashboard';
import CandidateJobs from '@/pages/candidate/jobs';
import JobDetail from '@/pages/candidate/job-detail';
import ApplyFlow from '@/pages/candidate/apply-flow';
import CandidateInterview from '@/pages/candidate/interview';
import CreateJobFlow from '@/pages/recruiter/create-job';
import JobApplicants from '@/pages/recruiter/job-applicants';
import CandidateProfile from '@/pages/recruiter/candidate-profile';
import PipelineKanban from '@/pages/recruiter/pipeline';
import RecruiterInterviews from '@/pages/recruiter/interviews';
import RecruiterOffers from '@/pages/recruiter/offers';
import RecruiterMessages from '@/pages/recruiter/messages';
import RecruiterReports from '@/pages/recruiter/reports';
import CompanySettings from '@/pages/recruiter/settings/company';

import CandidateSaved from '@/pages/candidate/saved';
import CandidateInterviews from '@/pages/candidate/interviews';
import CandidateMessages from '@/pages/candidate/messages';
import CandidateProfilePage from '@/pages/candidate/profile';
import CandidateNotifications from '@/pages/candidate/notifications';

import RecruiterBilling from '@/pages/recruiter/settings/billing';
import RecruiterEnterpriseSettings from '@/pages/recruiter/settings/enterprise';
import BulkSelection from '@/pages/recruiter/bulk-selection';
import CandidateComparison from '@/pages/recruiter/candidate-comparison';
import CompletionMonitoring from '@/pages/recruiter/completion-monitoring';
import FinalDecision from '@/pages/recruiter/final-decision';
import InterviewDecision from '@/pages/recruiter/interview-decision';
import InterviewFeedback from '@/pages/recruiter/interview-feedback';
import InterviewQuestions from '@/pages/recruiter/interview-questions';
import RecruiterNotifications from '@/pages/recruiter/notifications';
import SendInvitations from '@/pages/recruiter/send-invitations';
import StatusUpdates from '@/pages/recruiter/status-updates';
import TeamActivity from '@/pages/recruiter/activity';
import CompanyProfile from '@/pages/candidate/company-profile';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <MotionConfig reducedMotion="user">
      <TooltipProvider>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Switch>
            <Route path="/" component={AuthPage} />

            {/* Recruiter Routes */}
            <Route path="/recruiter/*">
              <RequireAuth role="recruiter">
              <RecruiterShell>
                <Switch>
                  <Route path="/recruiter/dashboard" component={RecruiterDashboard} />
                  <Route path="/recruiter/jobs/new/:step" component={CreateJobFlow} />
                  <Route path="/recruiter/jobs/:id/applicants/bulk" component={BulkSelection} />
                  <Route path="/recruiter/jobs/:id/applicants/compare" component={CandidateComparison} />
                  <Route path="/recruiter/jobs/:id/applicants" component={JobApplicants} />
                  <Route path="/recruiter/jobs" component={RecruiterJobs} />
                  <Route path="/recruiter/candidates/:id" component={CandidateProfile} />
                  <Route path="/recruiter/candidates" component={RecruiterCandidates} />
                  <Route path="/recruiter/pipeline" component={PipelineKanban} />
                  <Route path="/recruiter/interviews/:id/invite" component={SendInvitations} />
                  <Route path="/recruiter/interviews/:id/questions" component={InterviewQuestions} />
                  <Route path="/recruiter/interviews/:id/feedback" component={InterviewFeedback} />
                  <Route path="/recruiter/interviews/:id/decision" component={InterviewDecision} />
                  <Route path="/recruiter/interviews" component={RecruiterInterviews} />
                  <Route path="/recruiter/decision/:id" component={FinalDecision} />
                  <Route path="/recruiter/completion-monitoring" component={CompletionMonitoring} />
                  <Route path="/recruiter/status-updates" component={StatusUpdates} />
                  <Route path="/recruiter/notifications" component={RecruiterNotifications} />
                  <Route path="/recruiter/activity" component={TeamActivity} />
                  <Route path="/recruiter/offers" component={RecruiterOffers} />
                  <Route path="/recruiter/messages" component={RecruiterMessages} />
                  <Route path="/recruiter/reports" component={RecruiterReports} />
                  <Route path="/recruiter/settings/company" component={CompanySettings} />
                  <Route path="/recruiter/settings/enterprise" component={RecruiterEnterpriseSettings} />
                  <Route path="/recruiter/settings/billing" component={RecruiterBilling} />
                  <Route component={() => <Redirect to="/recruiter/dashboard" />} />
                </Switch>
              </RecruiterShell>
              </RequireAuth>
            </Route>

            {/* Candidate Routes */}
            <Route path="/candidate/*">
              <RequireAuth role="candidate">
              <CandidateShell>
                <Switch>
                  <Route path="/candidate/dashboard" component={CandidateDashboard} />
                  <Route path="/candidate/jobs" component={CandidateJobs} />
                  <Route path="/candidate/jobs/:id" component={JobDetail} />
                  <Route path="/candidate/company/:slug" component={CompanyProfile} />
                  <Route path="/candidate/apply/:id/:step" component={ApplyFlow} />
                  <Route path="/candidate/interviews/:id" component={CandidateInterview} />
                  <Route path="/candidate/saved" component={CandidateSaved} />
                  <Route path="/candidate/interviews" component={CandidateInterviews} />
                  <Route path="/candidate/messages" component={CandidateMessages} />
                  <Route path="/candidate/profile" component={CandidateProfilePage} />
                  <Route path="/candidate/notifications" component={CandidateNotifications} />
                  <Route component={() => <Redirect to="/candidate/dashboard" />} />
                </Switch>
              </CandidateShell>
              </RequireAuth>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      </MotionConfig>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
