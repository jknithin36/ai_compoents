export const ErrorInstance = function (
  code: string,
  message: string,
  status: number,
) {
  return Response.json(
    {
      success: false,
      code,
      message,
    },
    {
      status,
    },
  );
};
