"use client";
import type React from "react";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { sendEmailOTP, verifySecret } from "@/lib/actions/users.action";
import { Loader2, Lock } from "lucide-react";

const OTPModal = ({
  accountId,
  email,
}: {
  accountId: string;
  email: string;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [secret, setSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!canResend && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (secret.length !== 6) {
      setErrorMessage("Please enter a 6-digit OTP code.");
      setIsLoading(false);
      return;
    }

    try {
      const sessionId = await verifySecret({ accountId, secret });
      if (sessionId) router.push("/");
    } catch (error: any) {
      console.log("Error verifying OTP:", error);
      setErrorMessage(
        error.message || "Failed to verify OTP. Please try again."
      );
    }

    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    try {
      setErrorMessage(null);
      await sendEmailOTP({ email });
      setErrorMessage("OTP sent successfully! Check your email.");
      setCountdown(60);
      setCanResend(false);
      setTimeout(() => setErrorMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(
        error.message || "Failed to resend OTP. Please try again."
      );
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="rounded-lg border border-slate-200 bg-white p-0 shadow-lg max-w-md">
        <AlertDialogHeader className="space-y-4 border-b border-slate-100 p-6">
          <div className="flex justify-center mb-2">
            <div className="rounded-lg bg-blue-50 p-3">
              <Lock className="h-6 w-6 text-blue-700" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl font-bold text-slate-900">
            Verify your email
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-slate-600">
            We&apos;ve sent a 6-digit code to{" "}
            <span className="font-medium text-slate-900">{email}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 p-6">
          <div>
            <InputOTP
              maxLength={6}
              value={secret}
              onChange={setSecret}
              render={({ slots }) => (
                <InputOTPGroup className="flex justify-center gap-3">
                  {slots.map((slot, index) => (
                    <InputOTPSlot
                      index={0} key={index}
                      {...slot}
                      className="h-12 w-10 rounded-md border border-slate-300 bg-white text-center text-lg font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"                    />
                  ))}
                </InputOTPGroup>
              )}
            />
          </div>

          {errorMessage && (
            <div
              className={`rounded-md p-3 text-sm text-center ${
                errorMessage.includes("successfully")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {errorMessage}
            </div>
          )}

          <AlertDialogAction
            onClick={handleSubmit}
            className="w-full h-10 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-md transition-colors"
            type="button"
            disabled={isLoading || secret.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </AlertDialogAction>

          <div className="text-center space-y-3 border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-600">
              Didn&apos;t receive the code?
            </p>
            <Button
              type="button"
              variant="ghost"
              className={`w-full text-sm font-medium rounded-md transition-colors ${
                canResend
                  ? "text-blue-700 hover:bg-blue-50 cursor-pointer"
                  : "text-slate-400 cursor-not-allowed"
              }`}
              onClick={handleResendOtp}
              disabled={!canResend}
            >
              {canResend ? "Resend Code" : `Resend code in ${countdown}s`}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OTPModal;
