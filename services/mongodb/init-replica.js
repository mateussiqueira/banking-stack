/**
 * MongoDB Replica Set Initialization
 *
 * This script runs automatically when the MongoDB container starts
 * for the first time. It initiates the replica set required for
 * transactions and change streams used by Banking services.
 *
 * The replica set name must match the `--replSet rs0` argument
 * in docker-compose.yml.
 */

(function initReplicaSet() {
  print("────────────────────────────────────────────");
  print("  Initiate MongoDB Replica Set");
  print("────────────────────────────────────────────");

  const replicaSetConfig = {
    _id: "rs0",
    version: 1,
    term: 1,
    protocolVersion: 1,
    writeConcernMajorityJournalDefault: true,
    members: [
      {
        _id: 0,
        host: "localhost:27017",
        priority: 10,
        votes: 1,
        arbiterOnly: false,
        hidden: false,
        slaveDelay: 0,
        buildIndexes: true,
      },
    ],
    settings: {
      chainingAllowed: true,
      heartbeatIntervalMillis: 2000,
      heartbeatTimeoutSecs: 10,
      electionTimeoutMillis: 10000,
      catchUpTimeoutMillis: 60000,
      getLastErrorModes: {},
      getLastErrorDefaults: {
        w: 1,
        wtimeout: 0,
      },
      replicaSetId: ObjectId(),
    },
  };

  try {
    const status = rs.status();
    print("✓ Replica set already initiated:");
    print(`  Name:      ${status.set}`);
    print(`  Members:   ${status.members.length}`);
    status.members.forEach((m) => {
      print(`    ${m._id}: ${m.name} → ${m.stateStr}`);
    });
  } catch (e) {
    // rs.status() throws when the replica set is not yet initiated
    print("→ Initializing replica set 'rs0'...");
    print(`  Config: ${JSON.stringify(replicaSetConfig, null, 4)}`);

    const result = rs.initiate(replicaSetConfig);
    print(`✓ Replica set initiated (ok: ${result.ok})`);

    // Wait briefly for the primary election
    sleep(2000);

    const updatedStatus = rs.status();
    print(`  Set name:  ${updatedStatus.set}`);
    print(`  Members:   ${updatedStatus.members.length}`);
    updatedStatus.members.forEach((m) => {
      print(`    ${m._id}: ${m.name} → ${m.stateStr}`);
    });
  }

  // ─── Create the application database ─────────────────────────────
  const dbName = db.getName() || "banking_challenges";
  const appDb = db.getSiblingDB(dbName);

  // Create collections with schema validation for key domains
  // This is done on first connect — collections are created lazily
  // by the application, but we ensure the DB exists
  appDb.createCollection("__init", { capped: true, size: 4096 });
  appDb.__init.insertOne({
    _created: new Date(),
    replicaSet: "rs0",
    environment: process.env.NODE_ENV || "development",
  });
  appDb.__init.drop();

  print(`✓ Database '${dbName}' initialized`);
  print("────────────────────────────────────────────");
})();
