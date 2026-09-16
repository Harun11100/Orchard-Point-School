export default function filterStudentsByRollAndStatus({
  students,
  rollQuery,
  status,
}) {
  let result = [...students];

  if (status && status !== "all") {
    result = result.filter(
      (s) => s.paymentStatus === status
    );
  }
  if (rollQuery?.trim()) {
    result = result.filter((s) =>
      String(s.roll).includes(rollQuery.trim())
    );
  }
  return result;
}