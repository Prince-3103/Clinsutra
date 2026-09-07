import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { DemoModeSwitcher, ErrorBoundary } from "@/components/common"
import { KioskSessionProvider } from "@/hooks"
import { DoctorLayout, KioskLayout } from "@/layouts"
import { NotFoundPage } from "@/pages/NotFoundPage"
import {
  CompletePage,
  DocumentsPage,
  FollowUpPage,
  InterviewPage,
  PatientIdPage,
  ProcessingPage,
  RedFlagPage,
  ReviewPage,
  WelcomePage,
} from "@/pages/patient"
import {
  AlertsPage,
  ClinicalSummaryPage,
  QueuePage,
  TimelinePage,
} from "@/pages/doctor"

/**
 * Routes.
 *
 * `/kiosk/*` is the patient journey; `/doctor/*` is the clinician dashboard.
 * Both are real URLs, so the browser's back button works and any screen can be
 * opened directly during a demo.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <KioskSessionProvider>
          <DemoModeSwitcher />

          <Routes>
            <Route path="/" element={<Navigate to="/kiosk" replace />} />

            <Route path="/kiosk" element={<KioskLayout />}>
              <Route index element={<WelcomePage />} />
              <Route path="identify" element={<PatientIdPage />} />
              <Route path="interview" element={<InterviewPage />} />
              <Route path="follow-up" element={<FollowUpPage />} />
              <Route path="red-flag" element={<RedFlagPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="processing" element={<ProcessingPage />} />
              <Route path="review" element={<ReviewPage />} />
              <Route path="complete" element={<CompletePage />} />
            </Route>

            <Route path="/doctor" element={<DoctorLayout />}>
              <Route index element={<Navigate to="/doctor/queue" replace />} />
              <Route path="queue" element={<QueuePage />} />
              <Route path="summary" element={<ClinicalSummaryPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="alerts" element={<AlertsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </KioskSessionProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
