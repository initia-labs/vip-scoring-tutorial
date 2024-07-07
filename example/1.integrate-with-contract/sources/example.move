// Assume that example.move is a contract 
module deployer::example {
    struct ModuleStore {
        data_1: u64,
        data_2: u64
    }

    public entry fun initialize(deployer: &signer) {
        let store = ModuleStore { data_1: 0, data_2: 0 };
        move_to(deployer, &store);
    }

    fun task_1() {
        //
        // do something
        //
    }

    fun task_2() {
        //
        // do something
        //
    }

    fun task_3() {
        //
        // do something
        //
    }

    public entry fun awesome_fun_1(account: &signer) {
        task_1();
    }

    public entry fun awesome_fun_2(account: &signer) {
        task_2();
    }

    public entry fun awesome_fun_3(account: &signer) {
        task_3();
    }
}
