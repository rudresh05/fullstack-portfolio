"use client";

import React, { useEffect, useState, useRef } from "react";

interface ModalState {
  open: boolean;
  title: string;
  param: string;
  icon: string;
}

interface Floater {
  id: number;
  char: string;
  left: string;
  fontSize: string;
  animationDuration: string;
}

export default function SorryBubuPage() {
  const [stars, setStars] = useState<Array<{ id: number; left: string; top: string; animationDelay: string }>>([]);
  const [activeScene, setActiveScene] = useState<string>("intro");
  const [gardenOpened, setGardenOpened] = useState(false);
  const [found, setFound] = useState<boolean[]>([false, false, false, false, false]);
  const [modal, setModal] = useState<ModalState>({
    open: false,
    title: "For Bubu",
    param: "",
    icon: "❤️",
  });
  const [stage, setStage] = useState(0);
  const [noBtnPos, setNoBtnPos] = useState<{ left: string; top: string } | null>(null);
  const [doneText, setDoneText] = useState("");
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const floaterIdRef = useRef(0);

  // Generate stars on mount
  useEffect(() => {
    const starList = [];
    for (let i = 0; i < 170; i++) {
      starList.push({
        id: i,
        left: Math.random() * 100 + "%",
        top: Math.random() * 100 + "%",
        animationDelay: Math.random() * 3 + "s",
      });
    }
    setStars(starList);
  }, []);

  const burst = (n = 12) => {
    const chars = ["🌸", "❤️", "💗", "✨", "🌹"];
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const id = floaterIdRef.current++;
        const newFloater: Floater = {
          id,
          char: chars[Math.floor(Math.random() * chars.length)],
          left: Math.random() * 100 + "vw",
          fontSize: 15 + Math.random() * 28 + "px",
          animationDuration: 3 + Math.random() * 4 + "s",
        };
        setFloaters((prev) => [...prev, newFloater]);
        setTimeout(() => {
          setFloaters((prev) => prev.filter((f) => f.id !== id));
        }, 7500);
      }, i * 55);
    }
  };

  const openModal = (t: string, p: string, i = "❤️") => {
    setModal({ open: true, title: t, param: p, icon: i });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, open: false }));
  };

  const start = () => {
    setGardenOpened(true);
    setActiveScene("garden");
    burst(8);
  };

  const sit = () => {
    openModal(
      "You found me. 🪑",
      "Bubu, if you are sitting here, your Betu would quietly sit next to you. No talking. Bas shoulder pe head rakh do. ❤️"
    );
    setTimeout(() => {
      setActiveScene("giftScene");
    }, 1700);
  };

  const gift = (i: number) => {
    const updatedFound = [...found];
    updatedFound[i] = true;
    setFound(updatedFound);

    const giftData = [
      ["🌷", "Flowers for Bubu", "One flower for every time your Betu wants to say: you are loved. 🌸"],
      ["🧸", "Emergency Hug", "Come here. Tight hug. And no, you are not allowed to leave immediately. 🫂"],
      ["💌", "A tiny note", "Bubu, tum gussa ho sakti ho. Main tumhe pyaar karna band nahi karunga. ❤️"],
      [
        "🎵",
        "A song for this moment",
        "Press play in your own favourite song while reading this: today is officially Bubu-pampering day. 🎶",
      ],
      ["🗝️", "The last key", "This key opens the only thing left: a message your Betu really wants you to hear."],
    ][i];

    openModal(giftData[1], giftData[2], giftData[0]);

    if (i === 4 && updatedFound.every(Boolean)) {
      setTimeout(() => {
        setActiveScene("letter");
      }, 1800);
    }
  };

  const toGame = () => {
    setActiveScene("game");
  };

  const soothe = () => {
    const nextStage = stage + 1;
    setStage(nextStage);
    burst(nextStage > 4 ? 8 : 2);
    if (nextStage >= 6) {
      setTimeout(() => {
        setActiveScene("final");
      }, 900);
    }
  };

  const escapeNo = () => {
    setNoBtnPos({
      left: 10 + Math.random() * 70 + "vw",
      top: 20 + Math.random() * 60 + "vh",
    });
  };

  const finish = () => {
    setDoneText("🥹❤️\nHug accepted. Bubu wins. Betu surrenders completely.");
    burst(45);
    setTimeout(() => {
      openModal(
        "The only ending that matters ❤️",
        "Bubu is officially loved, pampered, and very slightly spoiled by her Betu. Mission accomplished. 🫂"
      );
    }, 800);
  };

  const faces = ["😤", "😒", "🙄", "😑", "🙂", "🥺", "❤️"];
  const stageTitles = [
    "Bubu is still angry.",
    "Not impressed.",
    "Hmm… Betu try harder.",
    "The anger is weakening.",
    "Okay… little smile detected.",
    "Almost pighal gayi.",
    "BUBU SMILED. ❤️",
  ];
  const stageSubtitles = [
    "Try again.",
    "Nope.",
    "Again. 🥺",
    "One more hug.",
    "That helped.",
    "Last one.",
    "Come here, Betu. 🫂",
  ];

  return (
    <div className="sorry-bubu-page select-none">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Caveat:wght@500;600;700&family=DM+Sans:wght@400;500;700&display=swap');

        .sorry-bubu-page {
          --bg: #05040a;
          --ink: #fff8fb;
          --muted: #c2b2ba;
          --rose: #ff729e;
          --rose2: #ffc1d2;
          --gold: #f4d49f;

          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: var(--bg);
          color: var(--ink);
          font-family: "DM Sans", sans-serif;
          z-index: 99999;
        }

        .sorry-bubu-page * {
          box-sizing: border-box;
        }

        .sorry-bubu-page button {
          font: inherit;
        }

        #world {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: #05040a;
        }

        #stars {
          position: absolute;
          inset: 0;
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          opacity: 0.2;
          animation: twinkle 3s infinite alternate;
        }

        @keyframes twinkle {
          to {
            opacity: 0.8;
            transform: scale(1.6);
          }
        }

        .aurora {
          position: absolute;
          width: 80vw;
          height: 60vh;
          left: 10%;
          top: -20%;
          border-radius: 50%;
          background: radial-gradient(ellipse, #7c285555, transparent 65%);
          filter: blur(35px);
          transition: 2s;
        }

        .mist {
          position: absolute;
          inset: 40% -10% 0;
          background: linear-gradient(transparent, #08060dbb 60%, #05040a);
          pointer-events: none;
        }

        .scene {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          text-align: center;
          transition: opacity 0.9s, transform 1s;
          z-index: 2;
        }

        .scene.off {
          opacity: 0;
          pointer-events: none;
          transform: scale(1.04);
        }

        .kicker {
          font-size: 9px;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: var(--gold);
        }

        .sorry-bubu-page h1,
        .sorry-bubu-page h2 {
          font-family: "Cormorant Garamond", serif;
          font-weight: 500;
        }

        .sorry-bubu-page h1 {
          font-size: clamp(70px, 15vw, 160px);
          line-height: 0.7;
          margin: 24px 0;
        }

        .sorry-bubu-page h1 em {
          color: var(--rose2);
          font-style: italic;
        }

        .sub {
          max-width: 570px;
          color: var(--muted);
          line-height: 1.8;
          font-size: 15px;
          margin: auto;
        }

        .btn {
          border: 1px solid #ffffff20;
          background: #ffffff0b;
          color: #fff;
          border-radius: 100px;
          padding: 14px 24px;
          cursor: pointer;
          font-weight: 700;
          backdrop-filter: blur(15px);
          transition: 0.25s;
          margin: 7px;
        }

        .btn:hover {
          transform: translateY(-3px);
          border-color: #ff9ebc66;
          background: #ff729e12;
        }

        .btn.primary {
          background: linear-gradient(135deg, #ff7ca6, #d84476);
          border: 0;
          box-shadow: 0 15px 45px #ff4e8828;
        }

        #intro .content {
          padding: 25px;
        }

        .scroll {
          position: absolute;
          bottom: 25px;
          color: #75666f;
          font-size: 9px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        /* garden */
        .garden {
          background: radial-gradient(circle at 50% 48%, #2b1222 0, #100914 43%, #05040a 85%);
        }

        .moon {
          position: absolute;
          right: 13%;
          top: 12%;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: #fff0d7;
          box-shadow: 0 0 70px #ffe9bd55;
        }

        .moon:after {
          content: "";
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #d7c3b0;
          left: 18px;
          top: 22px;
          opacity: 0.25;
        }

        .ground {
          position: absolute;
          left: -10%;
          right: -10%;
          bottom: -30%;
          height: 58%;
          background: linear-gradient(#1e121b, #09070c);
          transform: perspective(650px) rotateX(48deg);
          border-radius: 50%;
        }

        .path {
          position: absolute;
          width: 28%;
          height: 75%;
          bottom: -22%;
          left: 36%;
          background: linear-gradient(90deg, #3a2730, #5b3b43, #2d2027);
          clip-path: polygon(35% 0, 65% 0, 93% 100%, 7% 100%);
          filter: drop-shadow(0 0 20px #000);
        }

        .gate {
          position: absolute;
          top: 27%;
          left: 50%;
          transform: translateX(-50%);
          width: 190px;
          height: 270px;
          border: 13px solid #b98347;
          border-bottom: 0;
          border-radius: 95px 95px 0 0;
          box-shadow: 0 0 35px #ffca7450;
          transition: 1s;
        }

        .gate:after {
          content: "";
          position: absolute;
          left: 50%;
          top: 20%;
          height: 80%;
          width: 2px;
          background: #f3c98288;
        }

        .garden.opened .gate {
          transform: translateX(-50%) translateY(-100px);
          opacity: 0.15;
        }

        .tree {
          position: absolute;
          bottom: 22%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 170px;
          filter: drop-shadow(0 0 30px #ff719d20);
          opacity: 0.88;
        }

        .tree:after {
          content: "✦";
          position: absolute;
          color: #ffb3c9;
          left: 45%;
          top: 5%;
          font-size: 30px;
          animation: float 2s infinite alternate;
        }

        @keyframes float {
          to {
            transform: translateY(-8px);
          }
        }

        .bench {
          position: absolute;
          bottom: 21%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 45px;
          cursor: pointer;
          z-index: 5;
        }

        .firefly {
          position: absolute;
          font-size: 18px;
          color: #fff0a7;
          filter: drop-shadow(0 0 12px #fff0a7);
          animation: fly 4s ease-in-out infinite;
        }

        .f1 {
          left: 42%;
          top: 50%;
        }

        .f2 {
          left: 58%;
          top: 44%;
          animation-delay: 1s;
        }

        .f3 {
          left: 38%;
          top: 57%;
          animation-delay: 2s;
        }

        @keyframes fly {
          50% {
            transform: translate(35px, -20px);
          }
        }

        /* gift path */
        .gifts {
          position: absolute;
          bottom: 20%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 34px;
          align-items: flex-end;
        }

        .gift {
          width: 82px;
          height: 82px;
          border-radius: 20px;
          background: #ffffff08;
          border: 1px solid #ffffff15;
          display: grid;
          place-items: center;
          font-size: 38px;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 20px 50px #0006;
          position: relative;
        }

        .gift:hover {
          transform: translateY(-12px) scale(1.06);
          border-color: #ff9ebc55;
        }

        .gift.done {
          background: #ff729e18;
          border-color: #ffb2c833;
          box-shadow: 0 0 35px #ff729e22;
        }

        .gift small {
          position: absolute;
          transform: translateY(60px);
          font-size: 9px;
          letter-spacing: 0.12em;
          color: #8d7c85;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* letter */
        .letterwrap {
          width: min(680px, 92vw);
          padding: 20px;
        }

        .paper {
          position: relative;
          background: #f9efe5;
          color: #39272d;
          padding: 42px 42px 35px;
          border-radius: 4px;
          box-shadow: 0 35px 100px #000;
          transform: rotate(-0.7deg);
          overflow: hidden;
          text-align: left;
        }

        .paper:before {
          content: "";
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(transparent 0 31px, #7e58600d 32px 33px);
        }

        .paper h2,
        .paper p {
          position: relative;
        }

        .paper h2 {
          font-family: Caveat, cursive;
          font-size: 56px;
          margin: 0 0 10px;
        }

        .paper p {
          font-family: Caveat, cursive;
          font-size: 27px;
          line-height: 1.45;
          margin: 12px 0;
        }

        .paper .sign {
          font-size: 34px;
          color: #b94c72;
          text-align: right;
          margin-top: 20px;
          font-family: Caveat, cursive;
        }

        /* modal */
        .modal {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: grid;
          place-items: center;
          background: #030208cc;
          backdrop-filter: blur(14px);
          padding: 20px;
          transition: opacity 0.3s;
        }

        .modal.off {
          opacity: 0;
          pointer-events: none;
        }

        .modalbox {
          position: relative;
          width: min(620px, 100%);
          border: 1px solid #ffffff18;
          border-radius: 34px;
          background: linear-gradient(145deg, #26121d, #0d080e);
          padding: 40px;
          text-align: center;
          box-shadow: 0 40px 120px #000;
        }

        .modalbox .big {
          font-size: 60px;
        }

        .modalbox h2 {
          font-size: 55px;
          margin: 8px;
        }

        .modalbox p {
          color: #c9b9c1;
          line-height: 1.8;
        }

        .close {
          position: absolute;
          right: 25px;
          top: 20px;
          border: 0;
          background: none;
          color: #9d8992;
          font-size: 30px;
          cursor: pointer;
        }

        /* final */
        .final {
          background: radial-gradient(circle at 50% 45%, #42152d, #09060d 60%);
        }

        .final .heart {
          font-size: 100px;
          filter: drop-shadow(0 0 55px #ff6d9d77);
          animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
          50% {
            transform: scale(1.12);
          }
        }

        .final h2 {
          font-size: clamp(58px, 11vw, 110px);
          line-height: 0.8;
          margin: 20px;
        }

        .final p {
          color: #c7b7bf;
          line-height: 1.8;
        }

        .signature {
          font-family: Caveat, cursive;
          font-size: 60px;
          color: var(--rose2);
          margin-top: 25px;
        }

        .float {
          position: fixed;
          bottom: -30px;
          z-index: 40;
          pointer-events: none;
          animation: rise linear forwards;
        }

        @keyframes rise {
          to {
            transform: translateY(-115vh) rotate(650deg);
            opacity: 0;
          }
        }

        @media (max-width: 650px) {
          .gate {
            width: 130px;
            height: 190px;
            border-width: 10px;
          }
          .tree {
            font-size: 125px;
          }
          .bench {
            bottom: 19%;
          }
          .gifts {
            gap: 9px;
          }
          .gift {
            width: 67px;
            height: 67px;
            font-size: 30px;
          }
          .gift small {
            font-size: 7px;
            transform: translateY(50px);
          }
          .paper {
            padding: 30px 25px;
          }
          .paper p {
            font-size: 23px;
          }
          .paper h2 {
            font-size: 47px;
          }
        }
      `}</style>

      {/* WORLD */}
      <div id="world">
        <div id="stars">
          {stars.map((s) => (
            <i
              key={s.id}
              className="star"
              style={{
                left: s.left,
                top: s.top,
                animationDelay: s.animationDelay,
              }}
            />
          ))}
        </div>
        <div className="aurora" />
        <div className="mist" />
      </div>

      {/* INTRO */}
      <section className={`scene ${activeScene !== "intro" ? "off" : ""}`} id="intro">
        <div className="content">
          <div className="kicker">classified · bubu only</div>
          <h1>
            For <em>Bubu.</em>
          </h1>
          <p className="sub">
            Your Betu has made one small place for you. There is nothing here you need to understand. Just explore.
          </p>
          <button className="btn primary" onClick={start}>
            Enter quietly ✦
          </button>
        </div>
        <div className="scroll">there is a path waiting ↓</div>
      </section>

      {/* GARDEN */}
      <section
        className={`scene garden ${gardenOpened ? "opened" : ""} ${activeScene !== "garden" ? "off" : ""}`}
        id="garden"
      >
        <div className="moon" />
        <div className="ground" />
        <div className="path" />
        <div className="gate" />
        <div className="tree">🌳</div>
        <div className="bench" onClick={sit}>
          🪑
        </div>
        <div className="firefly f1">✦</div>
        <div className="firefly f2">✦</div>
        <div className="firefly f3">✦</div>
        <div
          style={{
            position: "absolute",
            top: "7%",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "Caveat, cursive",
            fontSize: "31px",
            color: "#ffe7ee",
          }}
        >
          for Bubu ♡
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "10px",
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "#776771",
          }}
        >
          walk around · touch what glows
        </div>
      </section>

      {/* GIFTS */}
      <section className={`scene ${activeScene !== "giftScene" ? "off" : ""}`} id="giftScene">
        <div style={{ width: "100%", padding: "20px" }}>
          <div className="kicker">you found the little things</div>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(48px, 8vw, 82px)",
              fontWeight: 500,
              margin: "12px",
            }}
          >
            Five things for Bubu.
          </h2>
          <p className="sub">Open them slowly. Your Betu didn't put a timer on this.</p>
          <div className="gifts">
            <div className={`gift ${found[0] ? "done" : ""}`} onClick={() => gift(0)}>
              🌷<small>flowers</small>
            </div>
            <div className={`gift ${found[1] ? "done" : ""}`} onClick={() => gift(1)}>
              🧸<small>hug</small>
            </div>
            <div className={`gift ${found[2] ? "done" : ""}`} onClick={() => gift(2)}>
              💌<small>note</small>
            </div>
            <div className={`gift ${found[3] ? "done" : ""}`} onClick={() => gift(3)}>
              🎵<small>music</small>
            </div>
            <div className={`gift ${found[4] ? "done" : ""}`} onClick={() => gift(4)}>
              🗝️<small>key</small>
            </div>
          </div>
        </div>
      </section>

      {/* LETTER */}
      <section className={`scene ${activeScene !== "letter" ? "off" : ""}`} id="letter">
        <div className="letterwrap">
          <div className="paper">
            <h2>Bubu, come here…</h2>
            <p>I'm sorry, meri Bubu. ❤️</p>
            <p>Aaj koi explanation nahi. Bas tumhara gussa mujhe de do, aur ek hug apne Betu ko de do.</p>
            <p>
              Tum jitna gussa karna hai karo. Main manaata rahunga. Nakhre allowed. Ignore karna temporarily allowed. But
              leaving your Betu without a hug? <em>Not allowed.</em> 🥺
            </p>
            <p>Bas aaj mujhe tumhe thoda extra pyaar karne do.</p>
            <div className="sign">— your Betu ❤️</div>
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button className="btn" onClick={toGame}>
                Next ✦
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ANGRY GAME */}
      <section className={`scene ${activeScene !== "game" ? "off" : ""}`} id="game">
        <div>
          <div id="face" style={{ fontSize: "125px", filter: "drop-shadow(0 0 35px #ff709e44)" }}>
            {faces[Math.min(stage, 6)]}
          </div>
          <div className="kicker">final boss</div>
          <h2
            id="gt"
            style={{
              fontFamily: "Caveat, cursive",
              fontSize: "58px",
              margin: "10px",
            }}
          >
            {stageTitles[Math.min(stage, 6)]}
          </h2>
          <p id="gp" className="sub">
            {stageSubtitles[Math.min(stage, 6)]}
          </p>
          <button className="btn primary" onClick={soothe}>
            Manaao 🥺
          </button>
        </div>
      </section>

      {/* FINAL */}
      <section className={`scene final ${activeScene !== "final" ? "off" : ""}`} id="final">
        <div>
          <div className="heart">❤️</div>
          <div className="kicker">mission complete</div>
          <h2>
            Bubu,
            <br />
            come here.
          </h2>
          <p>
            No explanation.
            <br />
            No arguments.
            <br />
            Just one very long hug from your Betu.
          </p>
          <button className="btn primary" onClick={finish}>
            I forgive this idiot ❤️
          </button>
          <button
            className="btn"
            id="noBtn"
            style={noBtnPos ? { position: "fixed", left: noBtnPos.left, top: noBtnPos.top } : {}}
            onMouseEnter={escapeNo}
            onTouchStart={escapeNo}
            onClick={escapeNo}
          >
            Still angry 😤
          </button>
          <div
            id="done"
            style={{
              minHeight: "40px",
              marginTop: "15px",
              fontFamily: "Caveat, cursive",
              fontSize: "28px",
              color: "#ffc4d4",
              whiteSpace: "pre-line",
            }}
          >
            {doneText}
          </div>
          <div className="signature">— your Betu</div>
        </div>
      </section>

      {/* MODAL */}
      <div className={`modal ${!modal.open ? "off" : ""}`} id="modal">
        <button className="close" onClick={closeModal}>
          ×
        </button>
        <div className="modalbox">
          <div className="big" id="mi">
            {modal.icon}
          </div>
          <h2 id="mt">{modal.title}</h2>
          <p id="mp">{modal.param}</p>
          <button
            className="btn primary"
            onClick={() => {
              closeModal();
              burst(15);
            }}
          >
            Keep it, Bubu ♡
          </button>
        </div>
      </div>

      {/* FLOAT PARTICLES */}
      <div id="float">
        {floaters.map((f) => (
          <span
            key={f.id}
            className="float"
            style={{
              left: f.left,
              fontSize: f.fontSize,
              animationDuration: f.animationDuration,
            }}
          >
            {f.char}
          </span>
        ))}
      </div>
    </div>
  );
}
