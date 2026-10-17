
import { useEffect, useState } from "react";
import socket from "./socket";

import StatsBar from "./components/StatsBar";
import AlertFeed from "./components/AlertFeed";
import TransactionGraph from "./components/TransactionGraph";
import CaseModal from "./components/CaseModal";

const styles = {
  app: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#0A0A0A",
    color: "#F5F5F5",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "64px",
    padding: "0 24px",
    backgroundColor: "#111111",
    borderBottom: "1px solid #1E1E1E",
    boxSizing: "border-box",
  },
  title: {
    margin: 0,
    color: "#FF6B2B",
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#888888",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#FF6B2B",
  },
  main: {
    padding: "16px",
    boxSizing: "border-box",
  },
  statsSection: {
    width: "100%",
    marginBottom: "16px",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
    gap: "16px",
    alignItems: "start",
    width: "100%",
  },
  panel: {
    minWidth: 0,
    backgroundColor: "#111111",
    border: "1px solid #1E1E1E",
    borderRadius: "8px",
    overflow: "hidden",
  },
  panelHeader: {
    margin: 0,
    padding: "14px 16px",
    borderBottom: "1px solid #1E1E1E",
    color: "#F5F5F5",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  panelBody: {
    padding: "12px",
    minWidth: 0,
  },
};

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    const handleRecentTransactions = (recentTransactions) => {
      setTransactions(
        Array.isArray(recentTransactions)
          ? recentTransactions.slice(0, 50)
          : []
      );
    };

    const handleNewTransaction = (transaction) => {
      setTransactions((previous) =>
        [transaction, ...previous].slice(0, 50)
      );
    };

    const handleNewAlert = (alert) => {
      setAlerts((previous) => [alert, ...previous].slice(0, 20));
    };

    socket.on("recentTransactions", handleRecentTransactions);
    socket.on("newTransaction", handleNewTransaction);
    socket.on("newAlert", handleNewAlert);

    return () => {
      socket.off("recentTransactions", handleRecentTransactions);
      socket.off("newTransaction", handleNewTransaction);
      socket.off("newAlert", handleNewAlert);
    };
  }, []);

  const handleSelectTx = (transaction) => {
    setSelectedTx(transaction);
  };

  const handleCloseModal = () => {
    setSelectedTx(null);
  };

  const handleUpdateCase = (updatedTransaction) => {
    if (!updatedTransaction) return;

    setTransactions((previous) =>
      previous.map((transaction) =>
        transaction.id === updatedTransaction.id
          ? { ...transaction, ...updatedTransaction }
          : transaction
      )
    );

    setAlerts((previous) =>
      previous.map((alert) =>
        alert.id === updatedTransaction.id
          ? { ...alert, ...updatedTransaction }
          : alert
      )
    );

    setSelectedTx((previous) =>
      previous?.id === updatedTransaction.id
        ? { ...previous, ...updatedTransaction }
        : previous
    );
  };

  return (
    <div style={styles.app}>
      <header style={styles.topBar}>
        <h1 style={styles.title}>FraudRadar</h1>

        <div style={styles.status}>
          <span style={styles.statusDot} />
          <span>FRAUD MONITORING</span>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.statsSection}>
          <StatsBar
            transactions={transactions}
            alerts={alerts}
          />
        </section>

        <div style={styles.contentGrid}>
          <section style={styles.panel}>
            <h2 style={styles.panelHeader}>
              Alert Feed
              <span
                style={{
                  float: "right",
                  color: "#FF6B2B",
                  fontFamily: "monospace",
                }}
              >
                {alerts.length.toString().padStart(2, "0")}
              </span>
            </h2>

            <div style={styles.panelBody}>
              <AlertFeed
                alerts={alerts}
                onSelectTx={handleSelectTx}
              />
            </div>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelHeader}>
              Transaction Graph
              <span
                style={{
                  float: "right",
                  color: "#888888",
                  fontFamily: "monospace",
                  fontWeight: 400,
                }}
              >
                {transactions.length} EVENTS
              </span>
            </h2>

            <div style={styles.panelBody}>
              <TransactionGraph
                transactions={transactions}
                onSelectTx={handleSelectTx}
              />
            </div>
          </section>
        </div>
      </main>

      {selectedTx && (
        <CaseModal
          selectedTx={selectedTx}
          onClose={handleCloseModal}
          onUpdate={handleUpdateCase}
        />
      )}
    </div>
  );
}
