import { ApplicationErrorBoundary } from "../components/application-error-boundary";
import { LexigoBootstrappedApp } from "../components/lexigo-bootstrapped-app";

export default function Home() {
  return (
    <ApplicationErrorBoundary>
      <LexigoBootstrappedApp />
    </ApplicationErrorBoundary>
  );
}
