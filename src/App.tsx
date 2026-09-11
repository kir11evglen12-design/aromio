import { useState } from "react";
import { ShopProvider, useShop } from "./lib/shop";
import { useSmoothScroll } from "./lib/motion";

import Backdrop from "./components/Backdrop";
import Preloader from "./components/Preloader";
import Cursor from "./components/Cursor";
import Progress from "./components/Progress";
import Header from "./components/Header";
import MobileBar from "./components/MobileBar";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import Manifest from "./components/Manifest";
import Picker from "./components/Picker";
import Chapters from "./components/Chapters";
import Collection from "./components/Collection";
import Showcase from "./components/Showcase";
import SplitGender from "./components/SplitGender";
import Lines from "./components/Lines";
import Journal from "./components/Journal";
import Lexicon from "./components/Lexicon";
import Service from "./components/Service";
import Compare from "./components/Compare";
import CommandPalette from "./components/CommandPalette";
import Footer from "./components/Footer";
import ProductPage from "./components/ProductPage";
import ProfilePage from "./components/ProfilePage";
import CartDrawer from "./components/CartDrawer";
import SearchDrawer from "./components/SearchDrawer";
import AuthDrawer from "./components/AuthDrawer";
import Toast from "./components/Toast";

function Shell() {
  const [ready, setReady] = useState(false);
  const { drawer, closeDrawer } = useShop();
  useSmoothScroll();

  return (
    <>
      <Backdrop />
      <Preloader onDone={() => setReady(true)} />
      <Progress />
      <Cursor />
      <Header />

      <main id="top">
        <Hero ready={ready} />
        <Ticker />
        <Manifest />
        <Picker />
        <Chapters />
        <Collection />
        <Showcase />
        <Journal />
        <SplitGender />
        <Lexicon />
        <Ticker dark />
        <Lines />
        <Service />
      </main>

      <Footer />
      <MobileBar />

      <ProductPage />
      <ProfilePage />
      <Compare />
      <CommandPalette />

      <div className={"scrim" + (drawer ? " is-open" : "")} onClick={closeDrawer} />
      <CartDrawer />
      <SearchDrawer />
      <AuthDrawer />
      <Toast />
    </>
  );
}

export default function App() {
  return <ShopProvider><Shell /></ShopProvider>;
}
