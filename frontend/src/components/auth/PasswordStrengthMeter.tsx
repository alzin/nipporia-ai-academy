import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { PasswordStrength } from "../../types/registration.types";

interface IPasswordStrengthMeterProps {
  passwordStrength: PasswordStrength;
}

export const PasswordStrengthMeter = ({
  passwordStrength,
}: IPasswordStrengthMeterProps) => {
  const isStrong = passwordStrength.score === 100;

  return (
    <Box sx={{ mt: 1 }} aria-live="polite">
      <LinearProgress
        variant="determinate"
        value={passwordStrength.score}
        color={passwordStrength.color as any}
        sx={{ height: 6 }}
        aria-label="パスワードの強さ"
      />
      {isStrong ? (
        <Stack direction="row" spacing={0.75} alignItems="center" mt={1}>
          <CheckCircle sx={{ fontSize: 18, color: "success.main" }} aria-hidden="true" />
          <Typography variant="body2" sx={{ color: "success.main", fontWeight: 500 }}>
            条件をすべて満たしています
          </Typography>
        </Stack>
      ) : (
        <Box mt={1}>
          <Typography variant="body2" color="text.secondary">
            あと少しです。次の条件を満たしてください。
          </Typography>
          <Stack component="ul" spacing={0.25} sx={{ listStyle: "none", m: 0, p: 0, mt: 0.5 }}>
            {passwordStrength.feedback.map((item, index) => (
              <Stack
                component="li"
                key={index}
                direction="row"
                spacing={0.75}
                alignItems="center"
              >
                <RadioButtonUnchecked
                  sx={{ fontSize: 16, color: "text.secondary" }}
                  aria-hidden="true"
                />
                <Typography variant="body2" color="text.secondary">
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
