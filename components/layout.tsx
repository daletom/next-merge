//import Alert from './alert'
import Footer from './footer'
import Meta from './meta'
import 'lazysizes'
import 'lazysizes/plugins/parent-fit/ls.parent-fit'
import { ReactNode } from 'react'

type LayoutProps = {
  preview: boolean,
  children: ReactNode,
};

const Layout = (props: LayoutProps) => {
  const {
    preview,
    children
  } = props;
  return (
    <>
      <Meta />
      <div className="min-h-screen">
        <main>{children}</main>
      </div>
      <Footer />
    </>
  )
}
export default Layout;
