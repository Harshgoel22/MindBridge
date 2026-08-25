import { useEffect, useState } from "react"
import { AiOutlineMenu, AiOutlineClose, AiOutlineShoppingCart } from "react-icons/ai"
import { BsChevronDown } from "react-icons/bs"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { Link, matchPath, useLocation } from "react-router-dom"

import logo from "../../assets/Logo/Logo-Full-Light-bg.png"
import { NavbarLinks } from "../../data/navbar-links"
import { apiConnector } from "../../services/apiConnector"
import { categories } from "../../services/apis"
import { ACCOUNT_TYPE } from "../../utils/constants"
import ProfileDropdown from "../core/Auth/ProfileDropdown"


function Navbar() {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  const { totalItems } = useSelector((state) => state.cart)
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false)

  // Categories rarely change, so this is cached for 5 minutes and
  // de-duplicated across every Navbar mount — no more re-fetching
  // on every single page navigation.
  const { data: subLinks, isLoading: loading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiConnector("GET", categories.CATEGORIES_API)
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })

  // Close the mobile menu automatically on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileCatalogOpen(false)
  }, [location.pathname])

  const matchRoute = (route) => {
    return matchPath({ path: route }, location.pathname)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    setMobileCatalogOpen(false)
  }

  const availableCatalogLinks = subLinks?.filter(
    (subLink) => subLink?.courses?.length > 0
  )

  return (
    <div
      className={`relative flex h-14 items-center justify-center border-b-[1px] border-b-richblack-700 ${
        location.pathname !== "/" ? "bg-richblack-800" : ""
      } transition-all duration-200`}
    >
      <div className="flex w-11/12 max-w-maxContent items-center justify-between">
        {/* Logo */}
        <Link to="/" onClick={closeMobileMenu}>
          <img src={logo} alt="Logo" width={160} height={32} loading="lazy" />
        </Link>
        {/* Navigation links (desktop) */}
        <nav className="hidden md:block">
          <ul className="flex gap-x-6 text-richblack-25">
            {NavbarLinks.map((link, index) => (
              <li key={index}>
                {link.title === "Catalog" ? (
                  <>
                    <div
                      className={`group relative flex cursor-pointer items-center gap-1 ${
                        matchRoute("/catalog/:catalogName")
                          ? "text-yellow-25"
                          : "text-richblack-25"
                      }`}
                    >
                      <p>{link.title}</p>
                      <BsChevronDown />
                      <div className="invisible absolute left-[50%] top-[50%] z-[1000] flex w-[200px] translate-x-[-50%] translate-y-[3em] flex-col rounded-lg bg-richblack-5 p-4 text-richblack-900 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-[1.65em] group-hover:opacity-100 lg:w-[300px]">
                        <div className="absolute left-[50%] top-0 -z-10 h-6 w-6 translate-x-[80%] translate-y-[-40%] rotate-45 select-none rounded bg-richblack-5"></div>
                        {loading ? (
                          <p className="text-center">Loading...</p>
                        ) : availableCatalogLinks?.length ? (
                          <>
                            {availableCatalogLinks.map((subLink, i) => (
                              <Link
                                to={`/catalog/${subLink.name
                                  .split(" ")
                                  .join("-")
                                  .toLowerCase()}`}
                                className="rounded-lg bg-transparent py-4 pl-4 hover:bg-richblack-50"
                                key={i}
                              >
                                <p>{subLink.name}</p>
                              </Link>
                            ))}
                          </>
                        ) : (
                          <p className="text-center">No Courses Found</p>
                        )}
                      </div>
                    </div>
                  </>
                ) :
                (
                  <Link to={link?.path}>
                    <p
                      className={`${
                        matchRoute(link?.path)
                          ? "text-yellow-25"
                          : "text-richblack-25"
                      }`}
                    >
                      {link.title}
                    </p>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        {/* Login / Signup / Dashboard (desktop) */}
        <div className="hidden items-center gap-x-4 md:flex">
          {user && user?.accountType !== ACCOUNT_TYPE.INSTRUCTOR && (
            <Link to="/dashboard/cart" className="relative">
              <AiOutlineShoppingCart className="text-2xl text-richblack-100" />
              {totalItems > 0 && (
                <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center overflow-hidden rounded-full bg-richblack-600 text-center text-xs font-bold text-yellow-100">
                  {totalItems}
                </span>
              )}
            </Link>
          )}
          {token === null && (
            <Link to="/login">
              <button className="rounded-[8px] border border-richblack-700 bg-richblack-800 px-[12px] py-[8px] text-richblack-100">
                Log in
              </button>
            </Link>
          )}
          {token === null && (
            <Link to="/signup">
              <button className="rounded-[8px] border border-richblack-700 bg-richblack-800 px-[12px] py-[8px] text-richblack-100">
                Sign up
              </button>
            </Link>
          )}
          {token !== null && <ProfileDropdown />}
        </div>

        {/* Mobile: cart (if applicable) + hamburger toggle */}
        <div className="flex items-center gap-x-4 md:hidden">
          {user && user?.accountType !== ACCOUNT_TYPE.INSTRUCTOR && (
            <Link to="/dashboard/cart" className="relative" onClick={closeMobileMenu}>
              <AiOutlineShoppingCart className="text-2xl text-richblack-100" />
              {totalItems > 0 && (
                <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center overflow-hidden rounded-full bg-richblack-600 text-center text-xs font-bold text-yellow-100">
                  {totalItems}
                </span>
              )}
            </Link>
          )}
          <button
            className="mr-4"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <AiOutlineClose fontSize={24} fill="#AFB2BF" />
            ) : (
              <AiOutlineMenu fontSize={24} fill="#AFB2BF" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="absolute left-0 top-14 z-[1100] w-full border-b border-richblack-700 bg-richblack-800 md:hidden">
          <ul className="flex flex-col gap-y-2 px-6 py-4 text-richblack-25">
            {NavbarLinks.map((link, index) => (
              <li key={index} className="border-b border-richblack-700 py-2 last:border-none">
                {link.title === "Catalog" ? (
                  <div>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between"
                      onClick={() => setMobileCatalogOpen((prev) => !prev)}
                      aria-expanded={mobileCatalogOpen}
                    >
                      <p className={matchRoute("/catalog/:catalogName") ? "text-yellow-25" : ""}>
                        {link.title}
                      </p>
                      <BsChevronDown
                        className={`transition-transform duration-150 ${
                          mobileCatalogOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {mobileCatalogOpen && (
                      <ul className="mt-2 flex flex-col gap-y-2 pl-4">
                        {loading ? (
                          <li className="text-richblack-100">Loading...</li>
                        ) : availableCatalogLinks?.length ? (
                          availableCatalogLinks.map((subLink, i) => (
                            <li key={i}>
                              <Link
                                to={`/catalog/${subLink.name
                                  .split(" ")
                                  .join("-")
                                  .toLowerCase()}`}
                                onClick={closeMobileMenu}
                              >
                                <p className="text-richblack-100">{subLink.name}</p>
                              </Link>
                            </li>
                          ))
                        ) : (
                          <li className="text-richblack-100">No Courses Found</li>
                        )}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link to={link?.path} onClick={closeMobileMenu}>
                    <p className={matchRoute(link?.path) ? "text-yellow-25" : ""}>
                      {link.title}
                    </p>
                  </Link>
                )}
              </li>
            ))}

            {/* Login / Signup / Profile (mobile) */}
            <li className="flex flex-col gap-y-3 pt-2">
              {token === null && (
                <Link to="/login" onClick={closeMobileMenu}>
                  <button className="w-full rounded-[8px] border border-richblack-700 bg-richblack-700 px-[12px] py-[8px] text-richblack-100">
                    Log in
                  </button>
                </Link>
              )}
              {token === null && (
                <Link to="/signup" onClick={closeMobileMenu}>
                  <button className="w-full rounded-[8px] border border-richblack-700 bg-richblack-700 px-[12px] py-[8px] text-richblack-100">
                    Sign up
                  </button>
                </Link>
              )}
              {token !== null && (
                <div onClick={closeMobileMenu}>
                  <ProfileDropdown />
                </div>
              )}
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default Navbar