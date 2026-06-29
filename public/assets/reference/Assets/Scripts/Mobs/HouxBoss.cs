using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class HouxBoss : MonoBehaviour
{
    public float maxHealth;

    public float swampHealth;
    public float seaHealth;
    public float volcanoHealth;
    public float airHealth;

    private bool ulti1;
    private bool ulti2;
    private bool ulti3;
    private bool ulti4;
    
    private bool spawnMinion1;
    private bool spawnMinion2;

    public string mode;

    // Start is called before the first frame update
    void Start()
    {
        swampHealth = maxHealth;
        seaHealth = maxHealth;
        volcanoHealth = maxHealth;
        airHealth = maxHealth;

        mode = "sea";
    }

    // Update is called once per frame
    void Update()
    {
        switch (mode)
        {
            case "fire":
                if (volcanoHealth < (0.8 * (float) maxHealth) && !ulti1)
                {
                    GetComponent<FireUltimate>().ActivateUltimateF();
                    ulti1 = true;
                }

                if (volcanoHealth < (0.6 * (float) maxHealth) && !ulti2)
                {
                    GetComponent<FireUltimate>().ActivateUltimateF();
                    ulti2 = true;
                }

                if (volcanoHealth < (0.4 * (float) maxHealth) && !ulti3)
                {
                    GetComponent<FireUltimate>().ActivateUltimateF();
                    ulti3 = true;
                }

                if (volcanoHealth < (0.2 * (float) maxHealth) && !ulti4)
                {
                    GetComponent<FireUltimate>().ActivateUltimateF();
                    ulti4 = true;
                }
        
                if (volcanoHealth < (0.5 * (float) maxHealth) && !spawnMinion1)
                {
                    gameObject.GetComponent<FireUltimate>().InvokeMinion();
                    spawnMinion1 = true;
                }
                if (volcanoHealth < (0.1 * (float) maxHealth) && !spawnMinion2)
                {
                    gameObject.GetComponent<FireUltimate>().InvokeMinion();
                    spawnMinion2 = true;
                }
                break;
        }
        
        checkElementDie();
    }

    void checkElementDie()
    {
        if (mode == "sea")
        {
            if (seaHealth <= 0)
            {
                mode = "fire";
            }
        }
        else if (mode == "fire")
        {
            if (volcanoHealth <= 0)
            {
                mode = "swamp";
            }
        }
        else if (mode == "swamp")
        {
            if (swampHealth <= 0)
            {
                mode = "air";
            }
        }
        else if (mode == "air")
        {
            if (airHealth <= 0)
            {
                mode = "defeat";
            }
        }

        if (mode == "defeat")
        {
            //Lunch annim defeat
        }
    }
    
    void OnCollisionEnter2D(Collision2D other)
    {
        switch (mode)
        {
            case "sea":
                if (other.gameObject.tag.Equals("playerProjectile"))
                {
                    seaHealth -= other.gameObject.GetComponent<castSpell>().damages;
                    print("boop");

                }
                else if (other.gameObject.tag.Equals("RockPillar"))
                {
                    seaHealth -= other.gameObject.GetComponent<castRockPillar>().damages;
                }

                Invoke("resetVelocity", 1.1f);
                break;
            case "swamp":
                if (other.gameObject.tag.Equals("playerProjectile"))
                {
                    swampHealth -= other.gameObject.GetComponent<castSpell>().damages;
                    print("boop");

                }
                else if (other.gameObject.tag.Equals("RockPillar"))
                {
                    swampHealth -= other.gameObject.GetComponent<castRockPillar>().damages;
                }

                Invoke("resetVelocity", 1.1f);
                break; 
            case "air":
                if (other.gameObject.tag.Equals("playerProjectile"))
                {
                    airHealth -= other.gameObject.GetComponent<castSpell>().damages;
                    print("boop");

                }
                else if (other.gameObject.tag.Equals("RockPillar"))
                {
                    airHealth -= other.gameObject.GetComponent<castRockPillar>().damages;
                }

                Invoke("resetVelocity", 1.1f);
                break;
            case "fire":
                if (other.gameObject.tag.Equals("playerProjectile"))
                {
                    volcanoHealth -= other.gameObject.GetComponent<castSpell>().damages;
                    print("boop");

                }
                else if (other.gameObject.tag.Equals("RockPillar"))
                {
                    volcanoHealth -= other.gameObject.GetComponent<castRockPillar>().damages;
                }

                Invoke("resetVelocity", 1.1f);
                break;
        }
        
    }
}
