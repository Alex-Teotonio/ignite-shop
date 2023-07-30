import { AppProps } from "next/app";
import { loadStripe } from "@stripe/stripe-js";
import { globalStyles } from "../styles/global";
import { CartProvider } from 'use-shopping-cart'

import logoImg from "../assets/logo.svg"
import { Container, Header } from "../styles/pages/app"

import Image from "next/image"
globalStyles()

const stripePromise = loadStripe(process.env.PUBLIC_STRIPE_PUBLIC_KEY!)

function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider 
      stripe={process.env.PUBLIC_STRIPE_PUBLIC_KEY!} 
      cartMode="checkout-session"
      currency="USD"
      shouldPersist
    >
    <Container>
      <Header>
      <Image src={logoImg} alt="" />
      </Header>

      <Component {...pageProps} />
    </Container>
    </CartProvider>
  )
}

export default App