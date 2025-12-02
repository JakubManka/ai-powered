import { z } from "zod";

// Score submission schema with server-side validation
export const scoreSubmissionSchema = z.object({
  nick: z
    .string()
    .max(100, "Nickname must be at most 100 characters")
    .default(""),
  score: z
    .number()
    .int("Score must be an integer")
    .min(0, "Score must be non-negative")
    .max(10000, "Score cannot exceed 10000")
    .refine((val) => val % 10 === 0, "Score must be a multiple of 10"),
  snakeLength: z
    .number()
    .int("Snake length must be an integer")
    .min(3, "Snake length must be at least 3"),
});

// Validate that snake length matches score
export const validateScoreIntegrity = (score: number, snakeLength: number): boolean => {
  // Formula: snakeLength === 3 + (score / 10)
  return snakeLength === 3 + score / 10;
};

// Full submission validation including integrity check
export const validateSubmission = (data: unknown) => {
  const result = scoreSubmissionSchema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false as const,
      error: result.error.errors[0]?.message || "Invalid data",
    };
  }

  const { score, snakeLength } = result.data;
  
  if (!validateScoreIntegrity(score, snakeLength)) {
    return {
      success: false as const,
      error: "Score and snake length do not match. Expected snake length: " + (3 + score / 10),
    };
  }

  return {
    success: true as const,
    data: result.data,
  };
};

export type ScoreSubmission = z.infer<typeof scoreSubmissionSchema>;

