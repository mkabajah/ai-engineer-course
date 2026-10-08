import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listChallenges from "./tools/list-challenges";
import challengeResults from "./tools/challenge-results";
import listApplicants from "./tools/list-applicants";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "talent-streamline",
  title: "Talent Streamline",
  version: "0.1.0",
  instructions:
    "Tools for the HasoubLabs AI Engineer Accelerator. Use `list_challenges` to see challenges, `get_challenge_results` for scores, and `list_applicants` to review candidates. Results and applicants require an admin account.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listChallenges, challengeResults, listApplicants],
});
