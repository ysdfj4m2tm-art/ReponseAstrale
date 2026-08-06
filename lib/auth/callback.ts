const MAX_AUTH_PARAMETER_LENGTH = 8_192;

export function hasValidWorkOSCallbackParameters(request: Request) {
  const params = new URL(request.url).searchParams;
  const codes = params.getAll("code");
  const states = params.getAll("state");
  return codes.length === 1
    && states.length === 1
    && codes[0].length > 0
    && states[0].length > 0
    && codes[0].length <= MAX_AUTH_PARAMETER_LENGTH
    && states[0].length <= MAX_AUTH_PARAMETER_LENGTH;
}
