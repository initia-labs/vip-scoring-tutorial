module deployer::example_with_scoring {
    use std::error;
    use std::signer;

    use minitiad_std::object::{Self, ExtendRef};
    use minitiad_std::vip_score;

    
    const EUNAUTHORIZED: u64 = 1;
    const EINVALID_SCORE: u64 = 2;

    struct ModuleStore has key {
        data_1: u64,
        data_2: u64
    }

    // ScoreStore is needed for scoring functions triggered by user
    struct ScoreStore has key {
        extend_ref: ExtendRef,
        stage: u64
    }

    // set stage info for scoring
    public entry fun set_stage_script(deployer: &signer, stage: u64) acquires ScoreStore {
        assert!(signer::address_of(deployer) == @deployer,
            error::permission_denied(EUNAUTHORIZED));
        if (!exists<ScoreStore>(@deployer)) {
            let constructor_ref = object::create_named_object(deployer, b"seed", false);
            let extend_ref = object::generate_extend_ref(&constructor_ref);
            move_to(deployer, ScoreStore { extend_ref, stage })
        };

        let score_store = borrow_global_mut<ScoreStore>(@deployer);
        score_store.stage = stage;
    }

    // interface to update user score to specific value
    fun update_score(addr: address, score: u64) acquires ScoreStore {
        let score_store = borrow_global<ScoreStore>(@deployer);
        let deployer = &object::generate_signer_for_extending(&score_store.extend_ref);
        vip_score::update_score(deployer, addr, score_store.stage, score);
    }
    
    // interface to increase user score
    fun increase_score(addr: address, score: u64) acquires ScoreStore {
        let score_store = borrow_global<ScoreStore>(@deployer);
        let deployer = &object::generate_signer_for_extending(&score_store.extend_ref);
        vip_score::increase_score(deployer, addr, score_store.stage, score);
    }

    // interface to decrease user score. note that score cannot be decreased to < 0
    fun decrease_score(addr: address, score: u64) acquires ScoreStore {
        let score_store = borrow_global<ScoreStore>(@deployer);
        let deployer = &object::generate_signer_for_extending(&score_store.extend_ref);
        let user_score = vip_score::get_score(addr, score_store.stage);
        assert!(user_score >= score, error::invalid_argument(EINVALID_SCORE));
        vip_score::decrease_score(deployer, addr, score_store.stage, score);
    }

    fun task_1() {
        //
        // do something
        // 

        let update_value = 200
        update_score();
    }

    fun task_2() {
        //
        // do something
        //

        let increase_value = 100; // make policy for scoring
        increase_score();
    }

    fun task_3() {
        //
        // do something
        //

        let decrease_value = 50; // make policy for scoring
        decrease_score();
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

    #[test(chain = @0x1, deployer = @0x123, user_a = @0x888, user_b = 0x999)]
    fun test_e2e(
        chain: &signer, deployer: &signer, user_a: &signer, user_b: &signer,
    ) acquires ModuleStore, ScoreStore {
        vip_score::init_module_for_test(chain);
        vip_score::add_deployer_script(chain, signer::address_of(deployer));

        awesome_fun_1(user_a);
        awesome_fun_2(user_b);

        assert!(vip_score::get_score(signer::address_of(user_a), 1) == 0, 0);
        assert!(vip_score::get_score(signer::address_of(user_b), 1) == 0, 0);

        set_stage_script(deployer, 1);

        awesome_fun_1(user_a);
        awesome_fun_2(user_b);
        aweseme_fun_3(user_b);
        
        assert!(vip_score::get_score(signer::address_of(user_a), 1) == 200 , 0);
        assert!(vip_score::get_score(signer::address_of(user_b), 1) == 50 , 0);
    }
}
