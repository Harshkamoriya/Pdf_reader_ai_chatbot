
import { generateProblemContent } from "./genrate_Dsa_question";

generateProblemContent()
  .then(() => {
    console.log("🎉 All problems generated");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
