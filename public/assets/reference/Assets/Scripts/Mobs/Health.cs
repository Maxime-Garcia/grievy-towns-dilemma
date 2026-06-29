using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Health : MonoBehaviour
{
    public int LifePoints;
    public int maxHealth;
    public int GivenGold;

    private AudioSource audio;

    private void Start()
    {
        maxHealth = LifePoints;
        audio = gameObject.GetComponent<AudioSource>();
    }

    private void FixedUpdate()
    {
        if (LifePoints <= 0)
        {
            GameObject.FindGameObjectWithTag("Player").GetComponent<PlayerController>().money += GivenGold;
            GameObject.FindGameObjectWithTag("Player").GetComponent<PlayerController>().PlayGoldSound();

            if (gameObject.tag == "Boss")
            {
                gameObject.GetComponent<Boss>().death();
            }
            else
            {
                Destroy(gameObject);
            }
            
        }
    }

    void OnCollisionEnter2D(Collision2D other)
    {
     
        print("biip");

        
        if (other.gameObject.tag.Equals("playerProjectile"))
        {
            LifePoints -= other.gameObject.GetComponent<castSpell>().damages;
            print("boop");

        }
        else if (other.gameObject.tag.Equals("RockPillar"))
        {
            LifePoints -= other.gameObject.GetComponent<castRockPillar>().damages;
        }

        Invoke("resetVelocity", 1.1f);
    }

    void resetVelocity()
    {
        GetComponent<Rigidbody2D>().velocity = Vector3.zero;
    }
}