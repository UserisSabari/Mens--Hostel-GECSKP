export const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    // safe dev-only logging
     
    console.log(...args)
  }
}

export default devLog
