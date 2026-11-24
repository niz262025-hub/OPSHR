// Keep Preview navigation inside the isolated MYOPS staging environment.
export function myopsReturnUrl(env: Partial<NodeJS.ProcessEnv> = process.env): string {
  return env.VERCEL_ENV === 'preview'
    ? 'https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app/'
    : 'https://www.myops.com.my/';
}
